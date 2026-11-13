
window.DollarRecognizer = (function () {

    const NUM_POINTS = 64;

    // Distance between two points
    function distance(p1, p2) {
        const dx = p2.X - p1.X;
        const dy = p2.Y - p1.Y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Calculate path length
    function pathLength(points) {
        let length = 0;

        for (let i = 1; i < points.length; i++) {
            length += distance(points[i - 1], points[i]);
        }

        return length;
    }

    // Resample points into 64 equally spaced points
    function resample(points) {

        const totalLength = pathLength(points);

        if (totalLength === 0) return points;

        const interval = totalLength / (NUM_POINTS - 1);
        const result = [{ X: points[0].X, Y: points[0].Y }];

        let accumulated = 0;
        let segment = 1;

        for (let i = 1; i < NUM_POINTS - 1; i++) {

            const target = i * interval;

            while (segment < points.length - 1) {

                const segmentLength = distance(
                    points[segment - 1],
                    points[segment]
                );

                if (accumulated + segmentLength >= target) {
                    break;
                }

                accumulated += segmentLength;
                segment++;
            }

            const p1 = points[segment - 1];
            const p2 = points[segment];

            const segmentLength = distance(p1, p2);

            const t = segmentLength === 0
                ? 0
                : (target - accumulated) / segmentLength;

            result.push({
                X: p1.X + t * (p2.X - p1.X),
                Y: p1.Y + t * (p2.Y - p1.Y)
            });
        }

        const last = points[points.length - 1];

        result.push({
            X: last.X,
            Y: last.Y
        });

        return result;
    }

    // Calculate centroid
    function centroid(points) {

        let x = 0;
        let y = 0;

        for (const p of points) {
            x += p.X;
            y += p.Y;
        }

        return {
            X: x / points.length,
            Y: y / points.length
        };
    }

    // Rotate points around their centroid
    function rotatePoints(points, angle) {

        const center = centroid(points);
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        return points.map(p => {

            const dx = p.X - center.X;
            const dy = p.Y - center.Y;

            return {
                X: dx * cos - dy * sin + center.X,
                Y: dx * sin + dy * cos + center.Y
            };
        });
    }

    // Normalize rotation, scale and position
    // Uniform scaling preserves square/rectangle proportions
    function normalize(points) {

        const center = centroid(points);

        const angle = Math.atan2(
            points[0].Y - center.Y,
            points[0].X - center.X
        );

        let normalized = rotatePoints(points, -angle);

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        normalized.forEach(p => {
            minX = Math.min(minX, p.X);
            minY = Math.min(minY, p.Y);
            maxX = Math.max(maxX, p.X);
            maxY = Math.max(maxY, p.Y);
        });

        const size = Math.max(maxX - minX, maxY - minY);

        if (size === 0) return normalized;

        const c = centroid(normalized);

        return normalized.map(p => ({
            X: (p.X - c.X) / size,
            Y: (p.Y - c.Y) / size
        }));
    }

    // Distance between two normalized gestures
    function pathDistance(points1, points2) {

        let total = 0;

        for (let i = 0; i < NUM_POINTS; i++) {
            total += distance(points1[i], points2[i]);
        }

        return total / NUM_POINTS;
    }

    // Create points along polygon edges
    function createPolygon(vertices) {

        const points = [];
        const steps = 32;

        for (let i = 0; i < vertices.length; i++) {

            const start = vertices[i];
            const end = vertices[(i + 1) % vertices.length];

            for (let j = 0; j < steps; j++) {

                const t = j / steps;

                points.push({
                    X: start.X + (end.X - start.X) * t,
                    Y: start.Y + (end.Y - start.Y) * t
                });
            }
        }

        return points;
    }

    // Create circle template
    function createCircle() {

        const points = [];

        for (let i = 0; i < 128; i++) {

            const angle = (i / 128) * Math.PI * 2;

            points.push({
                X: Math.cos(angle),
                Y: Math.sin(angle)
            });
        }

        return points;
    }

    // Create multiple starting-point and direction variants
    function createVariants(points) {

        const sampled = resample(points);
        const variants = [];

        for (let shift = 0; shift < NUM_POINTS; shift += 4) {

            const shifted = [];

            for (let i = 0; i < NUM_POINTS; i++) {
                shifted.push(sampled[(i + shift) % NUM_POINTS]);
            }

            variants.push(normalize(shifted));

            const reversed = [...shifted].reverse();

            variants.push(normalize(reversed));
        }

        return variants;
    }

    // Build the four shape templates
    function createTemplates() {

        const templates = [];

        const shapes = [
            {
                name: "Circle",
                points: createCircle()
            },
            {
                name: "Square",
                points: createPolygon([
                    { X: 0, Y: 0 },
                    { X: 1, Y: 0 },
                    { X: 1, Y: 1 },
                    { X: 0, Y: 1 }
                ])
            },
            {
                name: "Rectangle",
                points: createPolygon([
                    { X: 0, Y: 0 },
                    { X: 2, Y: 0 },
                    { X: 2, Y: 1 },
                    { X: 0, Y: 1 }
                ])
            },
            {
                name: "Triangle",
                points: createPolygon([
                    { X: 0.5, Y: 0 },
                    { X: 1, Y: 1 },
                    { X: 0, Y: 1 }
                ])
            }
        ];

        shapes.forEach(shape => {

            const variants = createVariants(shape.points);

            variants.forEach(points => {

                templates.push({
                    name: shape.name,
                    points: points
                });
            });
        });

        return templates;
    }

    const templates = createTemplates();

    // Find the aspect ratio using principal-axis rotation
    function getAspectRatio(points) {

        const center = centroid(points);

        let xx = 0;
        let yy = 0;
        let xy = 0;

        points.forEach(p => {

            const dx = p.X - center.X;
            const dy = p.Y - center.Y;

            xx += dx * dx;
            yy += dy * dy;
            xy += dx * dy;
        });

        const angle = 0.5 * Math.atan2(2 * xy, xx - yy);

        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        points.forEach(p => {

            const dx = p.X - center.X;
            const dy = p.Y - center.Y;

            const x = dx * cos + dy * sin;
            const y = -dx * sin + dy * cos;

            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
        });

        const width = maxX - minX;
        const height = maxY - minY;

        if (Math.min(width, height) === 0) return Infinity;

        return Math.max(width, height) / Math.min(width, height);
    }
    // Check whether the drawing is a straight line
function isStraightLine(points) {

    const center = centroid(points);

    let xx = 0;
    let yy = 0;
    let xy = 0;

    points.forEach(p => {
        const dx = p.X - center.X;
        const dy = p.Y - center.Y;

        xx += dx * dx;
        yy += dy * dy;
        xy += dx * dy;
    });

    const angle = 0.5 * Math.atan2(2 * xy, xx - yy);

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    let maxDistance = 0;
    let maxLength = 0;

    points.forEach(p => {
        const dx = p.X - center.X;
        const dy = p.Y - center.Y;

        const perpendicular = Math.abs(
            -dx * sin + dy * cos
        );

        const parallel = Math.abs(
            dx * cos + dy * sin
        );

        maxDistance = Math.max(maxDistance, perpendicular);
        maxLength = Math.max(maxLength, parallel);
    });

    return maxLength > 0 &&
        maxDistance / maxLength < 0.07;
}


// Check whether the drawing is a circle
function isCircle(points) {

    const center = centroid(points);

    const distances = points.map(p =>
        distance(p, center)
    );

    const averageRadius = distances.reduce(
        (sum, value) => sum + value, 0
    ) / distances.length;

    if (averageRadius === 0) return false;

    const variance = distances.reduce(
        (sum, value) =>
            sum + Math.pow(value - averageRadius, 2),
        0
    ) / distances.length;

    const variation = Math.sqrt(variance) / averageRadius;

    const xs = points.map(p => p.X);
    const ys = points.map(p => p.Y);

    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);

    const aspectRatio = Math.max(width, height) /
        Math.max(1, Math.min(width, height));

    const perimeter = pathLength(points);
    const boundingPerimeter = 2 * (width + height);

    const perimeterRatio = perimeter / boundingPerimeter;

    return (
        variation < 0.16 &&
        aspectRatio < 1.25 &&
        perimeterRatio > 0.65 &&
        perimeterRatio < 0.93
    );
}
    // Main recognition function
   function Recognize(points) {

    if (!points || points.length < 10) {
        return {
            Name: "No match.",
            Score: 0
        };
    }

    const cleanPoints = points.map(p => ({
        X: Number(p.X),
        Y: Number(p.Y)
    }));

    if (cleanPoints.some(p =>
        !Number.isFinite(p.X) || !Number.isFinite(p.Y)
    )) {
        return {
            Name: "No match.",
            Score: 0
        };
    }

    // 1. Check straight line first
    if (isStraightLine(cleanPoints)) {
        return {
            Name: "Line",
            Score: 0.95
        };
    }

    // 2. Check circle before rectangle and square
    if (isCircle(cleanPoints)) {
        return {
            Name: "Circle",
            Score: 0.95
        };
    }

    // 3. Match remaining shapes using templates
    const sampled = resample(cleanPoints);
    const normalized = normalize(sampled);

    let bestDistance = Infinity;
    let bestShape = "No match.";

    templates.forEach(template => {

        const currentDistance = pathDistance(
            normalized,
            template.points
        );

        if (currentDistance < bestDistance) {
            bestDistance = currentDistance;
            bestShape = template.name;
        }
    });

    let score = 1 - (bestDistance / 0.70710678);

    score = Math.max(0, Math.min(1, score));

    // 4. Distinguish square and rectangle
    if (bestShape === "Square" || bestShape === "Rectangle") {

        const ratio = getAspectRatio(cleanPoints);

        bestShape = ratio > 1.20
            ? "Rectangle"
            : "Square";
    }

    if (score < 0.55) {
        return {
            Name: "No match.",
            Score: score
        };
    }

    return {
        Name: bestShape,
        Score: score
    };
}

    return {
        Recognize: Recognize
    };

})();
