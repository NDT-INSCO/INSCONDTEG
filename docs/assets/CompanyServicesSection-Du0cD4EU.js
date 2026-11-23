import { a as __toESM } from "./rolldown-runtime-oLLnCvco.js";
import { n as require_react, t as require_jsx_runtime } from "./jsx-runtime-CJAQq89J.js";
import { t as createLucideIcon } from "./createLucideIcon-Cyy1bEkm.js";
import { t as CircleCheck } from "./circle-check-C1rtQ7NC.js";
import { c as range, l as Crosshair } from "./src-CFjF8TB-.js";
import { t as Flame } from "./flame-DuWslMqX.js";
import { t as MapPin } from "./map-pin-CwI3o0GO.js";
import { t as Navigation } from "./navigation-Cjrfrd5q.js";
import { t as Plus } from "./plus-CZjdWV3u.js";
import { t as RotateCcw } from "./rotate-ccw-wuxYnQna.js";
import { t as ShieldCheck } from "./shield-check-BseoenC-.js";
import { I as useTheme, Jt as Layers, Q as COMPANY_MEDIA, St as Thermometer, X as SERVICE_FAMILIES, ct as COMMERCIAL_NDT_METHODS, dn as ChevronRight, fn as ChevronLeft, ft as Wrench, lt as INSCO_COMPANY_DATA, ot as SectionHeading, sn as Compass } from "./index-BKrODMj6.js";
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Minus = createLucideIcon("minus", [["path", {
	d: "M5 12h14",
	key: "1ays0h"
}]]);
/**
* @license lucide-react v0.546.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var SlidersHorizontal = createLucideIcon("sliders-horizontal", [
	["path", {
		d: "M10 5H3",
		key: "1qgfaw"
	}],
	["path", {
		d: "M12 19H3",
		key: "yhmn1j"
	}],
	["path", {
		d: "M14 3v4",
		key: "1sua03"
	}],
	["path", {
		d: "M16 17v4",
		key: "1q0r14"
	}],
	["path", {
		d: "M21 12h-9",
		key: "1o4lsq"
	}],
	["path", {
		d: "M21 19h-5",
		key: "1rlt1p"
	}],
	["path", {
		d: "M21 5h-7",
		key: "1oszz2"
	}],
	["path", {
		d: "M8 10v4",
		key: "tgpxqk"
	}],
	["path", {
		d: "M8 12H3",
		key: "a7s4jb"
	}]
]);
//#endregion
//#region node_modules/d3-array/src/fsum.js
var Adder = class {
	constructor() {
		this._partials = /* @__PURE__ */ new Float64Array(32);
		this._n = 0;
	}
	add(x) {
		const p = this._partials;
		let i = 0;
		for (let j = 0; j < this._n && j < 32; j++) {
			const y = p[j], hi = x + y, lo = Math.abs(x) < Math.abs(y) ? x - (hi - y) : y - (hi - x);
			if (lo) p[i++] = lo;
			x = hi;
		}
		p[i] = x;
		this._n = i + 1;
		return this;
	}
	valueOf() {
		const p = this._partials;
		let n = this._n, x, y, lo, hi = 0;
		if (n > 0) {
			hi = p[--n];
			while (n > 0) {
				x = hi;
				y = p[--n];
				hi = x + y;
				lo = y - (hi - x);
				if (lo) break;
			}
			if (n > 0 && (lo < 0 && p[n - 1] < 0 || lo > 0 && p[n - 1] > 0)) {
				y = lo * 2;
				x = hi + y;
				if (y == x - hi) hi = x;
			}
		}
		return hi;
	}
};
//#endregion
//#region node_modules/d3-array/src/merge.js
function* flatten(arrays) {
	for (const array of arrays) yield* array;
}
function merge(arrays) {
	return Array.from(flatten(arrays));
}
//#endregion
//#region node_modules/d3-geo/src/math.js
var epsilon = 1e-6;
var pi = Math.PI;
var halfPi = pi / 2;
var quarterPi = pi / 4;
var tau = pi * 2;
var degrees = 180 / pi;
var radians = pi / 180;
var abs = Math.abs;
var atan = Math.atan;
var atan2 = Math.atan2;
var cos = Math.cos;
var ceil = Math.ceil;
var exp = Math.exp;
var log = Math.log;
var sin = Math.sin;
var sign = Math.sign || function(x) {
	return x > 0 ? 1 : x < 0 ? -1 : 0;
};
var sqrt = Math.sqrt;
var tan = Math.tan;
function acos(x) {
	return x > 1 ? 0 : x < -1 ? pi : Math.acos(x);
}
function asin(x) {
	return x > 1 ? halfPi : x < -1 ? -halfPi : Math.asin(x);
}
//#endregion
//#region node_modules/d3-geo/src/noop.js
function noop() {}
//#endregion
//#region node_modules/d3-geo/src/stream.js
function streamGeometry(geometry, stream) {
	if (geometry && streamGeometryType.hasOwnProperty(geometry.type)) streamGeometryType[geometry.type](geometry, stream);
}
var streamObjectType = {
	Feature: function(object, stream) {
		streamGeometry(object.geometry, stream);
	},
	FeatureCollection: function(object, stream) {
		var features = object.features, i = -1, n = features.length;
		while (++i < n) streamGeometry(features[i].geometry, stream);
	}
};
var streamGeometryType = {
	Sphere: function(object, stream) {
		stream.sphere();
	},
	Point: function(object, stream) {
		object = object.coordinates;
		stream.point(object[0], object[1], object[2]);
	},
	MultiPoint: function(object, stream) {
		var coordinates = object.coordinates, i = -1, n = coordinates.length;
		while (++i < n) object = coordinates[i], stream.point(object[0], object[1], object[2]);
	},
	LineString: function(object, stream) {
		streamLine(object.coordinates, stream, 0);
	},
	MultiLineString: function(object, stream) {
		var coordinates = object.coordinates, i = -1, n = coordinates.length;
		while (++i < n) streamLine(coordinates[i], stream, 0);
	},
	Polygon: function(object, stream) {
		streamPolygon(object.coordinates, stream);
	},
	MultiPolygon: function(object, stream) {
		var coordinates = object.coordinates, i = -1, n = coordinates.length;
		while (++i < n) streamPolygon(coordinates[i], stream);
	},
	GeometryCollection: function(object, stream) {
		var geometries = object.geometries, i = -1, n = geometries.length;
		while (++i < n) streamGeometry(geometries[i], stream);
	}
};
function streamLine(coordinates, stream, closed) {
	var i = -1, n = coordinates.length - closed, coordinate;
	stream.lineStart();
	while (++i < n) coordinate = coordinates[i], stream.point(coordinate[0], coordinate[1], coordinate[2]);
	stream.lineEnd();
}
function streamPolygon(coordinates, stream) {
	var i = -1, n = coordinates.length;
	stream.polygonStart();
	while (++i < n) streamLine(coordinates[i], stream, 1);
	stream.polygonEnd();
}
function stream_default(object, stream) {
	if (object && streamObjectType.hasOwnProperty(object.type)) streamObjectType[object.type](object, stream);
	else streamGeometry(object, stream);
}
//#endregion
//#region node_modules/d3-geo/src/area.js
var areaRingSum$1 = new Adder();
var areaSum$1 = new Adder();
var lambda00;
var phi00;
var lambda0$1;
var cosPhi0$1;
var sinPhi0$1;
var areaStream$1 = {
	point: noop,
	lineStart: noop,
	lineEnd: noop,
	polygonStart: function() {
		areaRingSum$1 = new Adder();
		areaStream$1.lineStart = areaRingStart$1;
		areaStream$1.lineEnd = areaRingEnd$1;
	},
	polygonEnd: function() {
		var areaRing = +areaRingSum$1;
		areaSum$1.add(areaRing < 0 ? tau + areaRing : areaRing);
		this.lineStart = this.lineEnd = this.point = noop;
	},
	sphere: function() {
		areaSum$1.add(tau);
	}
};
function areaRingStart$1() {
	areaStream$1.point = areaPointFirst$1;
}
function areaRingEnd$1() {
	areaPoint$1(lambda00, phi00);
}
function areaPointFirst$1(lambda, phi) {
	areaStream$1.point = areaPoint$1;
	lambda00 = lambda, phi00 = phi;
	lambda *= radians, phi *= radians;
	lambda0$1 = lambda, cosPhi0$1 = cos(phi = phi / 2 + quarterPi), sinPhi0$1 = sin(phi);
}
function areaPoint$1(lambda, phi) {
	lambda *= radians, phi *= radians;
	phi = phi / 2 + quarterPi;
	var dLambda = lambda - lambda0$1, sdLambda = dLambda >= 0 ? 1 : -1, adLambda = sdLambda * dLambda, cosPhi = cos(phi), sinPhi = sin(phi), k = sinPhi0$1 * sinPhi, u = cosPhi0$1 * cosPhi + k * cos(adLambda), v = k * sdLambda * sin(adLambda);
	areaRingSum$1.add(atan2(v, u));
	lambda0$1 = lambda, cosPhi0$1 = cosPhi, sinPhi0$1 = sinPhi;
}
function area_default(object) {
	areaSum$1 = new Adder();
	stream_default(object, areaStream$1);
	return areaSum$1 * 2;
}
//#endregion
//#region node_modules/d3-geo/src/cartesian.js
function spherical(cartesian) {
	return [atan2(cartesian[1], cartesian[0]), asin(cartesian[2])];
}
function cartesian(spherical) {
	var lambda = spherical[0], phi = spherical[1], cosPhi = cos(phi);
	return [
		cosPhi * cos(lambda),
		cosPhi * sin(lambda),
		sin(phi)
	];
}
function cartesianDot(a, b) {
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function cartesianCross(a, b) {
	return [
		a[1] * b[2] - a[2] * b[1],
		a[2] * b[0] - a[0] * b[2],
		a[0] * b[1] - a[1] * b[0]
	];
}
function cartesianAddInPlace(a, b) {
	a[0] += b[0], a[1] += b[1], a[2] += b[2];
}
function cartesianScale(vector, k) {
	return [
		vector[0] * k,
		vector[1] * k,
		vector[2] * k
	];
}
function cartesianNormalizeInPlace(d) {
	var l = sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
	d[0] /= l, d[1] /= l, d[2] /= l;
}
//#endregion
//#region node_modules/d3-geo/src/compose.js
function compose_default(a, b) {
	function compose(x, y) {
		return x = a(x, y), b(x[0], x[1]);
	}
	if (a.invert && b.invert) compose.invert = function(x, y) {
		return x = b.invert(x, y), x && a.invert(x[0], x[1]);
	};
	return compose;
}
//#endregion
//#region node_modules/d3-geo/src/rotation.js
function rotationIdentity(lambda, phi) {
	if (abs(lambda) > pi) lambda -= Math.round(lambda / tau) * tau;
	return [lambda, phi];
}
rotationIdentity.invert = rotationIdentity;
function rotateRadians(deltaLambda, deltaPhi, deltaGamma) {
	return (deltaLambda %= tau) ? deltaPhi || deltaGamma ? compose_default(rotationLambda(deltaLambda), rotationPhiGamma(deltaPhi, deltaGamma)) : rotationLambda(deltaLambda) : deltaPhi || deltaGamma ? rotationPhiGamma(deltaPhi, deltaGamma) : rotationIdentity;
}
function forwardRotationLambda(deltaLambda) {
	return function(lambda, phi) {
		lambda += deltaLambda;
		if (abs(lambda) > pi) lambda -= Math.round(lambda / tau) * tau;
		return [lambda, phi];
	};
}
function rotationLambda(deltaLambda) {
	var rotation = forwardRotationLambda(deltaLambda);
	rotation.invert = forwardRotationLambda(-deltaLambda);
	return rotation;
}
function rotationPhiGamma(deltaPhi, deltaGamma) {
	var cosDeltaPhi = cos(deltaPhi), sinDeltaPhi = sin(deltaPhi), cosDeltaGamma = cos(deltaGamma), sinDeltaGamma = sin(deltaGamma);
	function rotation(lambda, phi) {
		var cosPhi = cos(phi), x = cos(lambda) * cosPhi, y = sin(lambda) * cosPhi, z = sin(phi), k = z * cosDeltaPhi + x * sinDeltaPhi;
		return [atan2(y * cosDeltaGamma - k * sinDeltaGamma, x * cosDeltaPhi - z * sinDeltaPhi), asin(k * cosDeltaGamma + y * sinDeltaGamma)];
	}
	rotation.invert = function(lambda, phi) {
		var cosPhi = cos(phi), x = cos(lambda) * cosPhi, y = sin(lambda) * cosPhi, z = sin(phi), k = z * cosDeltaGamma - y * sinDeltaGamma;
		return [atan2(y * cosDeltaGamma + z * sinDeltaGamma, x * cosDeltaPhi + k * sinDeltaPhi), asin(k * cosDeltaPhi - x * sinDeltaPhi)];
	};
	return rotation;
}
function rotation_default(rotate) {
	rotate = rotateRadians(rotate[0] * radians, rotate[1] * radians, rotate.length > 2 ? rotate[2] * radians : 0);
	function forward(coordinates) {
		coordinates = rotate(coordinates[0] * radians, coordinates[1] * radians);
		return coordinates[0] *= degrees, coordinates[1] *= degrees, coordinates;
	}
	forward.invert = function(coordinates) {
		coordinates = rotate.invert(coordinates[0] * radians, coordinates[1] * radians);
		return coordinates[0] *= degrees, coordinates[1] *= degrees, coordinates;
	};
	return forward;
}
//#endregion
//#region node_modules/d3-geo/src/circle.js
function circleStream(stream, radius, delta, direction, t0, t1) {
	if (!delta) return;
	var cosRadius = cos(radius), sinRadius = sin(radius), step = direction * delta;
	if (t0 == null) {
		t0 = radius + direction * tau;
		t1 = radius - step / 2;
	} else {
		t0 = circleRadius(cosRadius, t0);
		t1 = circleRadius(cosRadius, t1);
		if (direction > 0 ? t0 < t1 : t0 > t1) t0 += direction * tau;
	}
	for (var point, t = t0; direction > 0 ? t > t1 : t < t1; t -= step) {
		point = spherical([
			cosRadius,
			-sinRadius * cos(t),
			-sinRadius * sin(t)
		]);
		stream.point(point[0], point[1]);
	}
}
function circleRadius(cosRadius, point) {
	point = cartesian(point), point[0] -= cosRadius;
	cartesianNormalizeInPlace(point);
	var radius = acos(-point[1]);
	return ((-point[2] < 0 ? -radius : radius) + tau - epsilon) % tau;
}
//#endregion
//#region node_modules/d3-geo/src/clip/buffer.js
function buffer_default() {
	var lines = [], line;
	return {
		point: function(x, y, m) {
			line.push([
				x,
				y,
				m
			]);
		},
		lineStart: function() {
			lines.push(line = []);
		},
		lineEnd: noop,
		rejoin: function() {
			if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));
		},
		result: function() {
			var result = lines;
			lines = [];
			line = null;
			return result;
		}
	};
}
//#endregion
//#region node_modules/d3-geo/src/pointEqual.js
function pointEqual_default(a, b) {
	return abs(a[0] - b[0]) < 1e-6 && abs(a[1] - b[1]) < 1e-6;
}
//#endregion
//#region node_modules/d3-geo/src/clip/rejoin.js
function Intersection(point, points, other, entry) {
	this.x = point;
	this.z = points;
	this.o = other;
	this.e = entry;
	this.v = false;
	this.n = this.p = null;
}
function rejoin_default(segments, compareIntersection, startInside, interpolate, stream) {
	var subject = [], clip = [], i, n;
	segments.forEach(function(segment) {
		if ((n = segment.length - 1) <= 0) return;
		var n, p0 = segment[0], p1 = segment[n], x;
		if (pointEqual_default(p0, p1)) {
			if (!p0[2] && !p1[2]) {
				stream.lineStart();
				for (i = 0; i < n; ++i) stream.point((p0 = segment[i])[0], p0[1]);
				stream.lineEnd();
				return;
			}
			p1[0] += 2 * epsilon;
		}
		subject.push(x = new Intersection(p0, segment, null, true));
		clip.push(x.o = new Intersection(p0, null, x, false));
		subject.push(x = new Intersection(p1, segment, null, false));
		clip.push(x.o = new Intersection(p1, null, x, true));
	});
	if (!subject.length) return;
	clip.sort(compareIntersection);
	link(subject);
	link(clip);
	for (i = 0, n = clip.length; i < n; ++i) clip[i].e = startInside = !startInside;
	var start = subject[0], points, point;
	while (1) {
		var current = start, isSubject = true;
		while (current.v) if ((current = current.n) === start) return;
		points = current.z;
		stream.lineStart();
		do {
			current.v = current.o.v = true;
			if (current.e) {
				if (isSubject) for (i = 0, n = points.length; i < n; ++i) stream.point((point = points[i])[0], point[1]);
				else interpolate(current.x, current.n.x, 1, stream);
				current = current.n;
			} else {
				if (isSubject) {
					points = current.p.z;
					for (i = points.length - 1; i >= 0; --i) stream.point((point = points[i])[0], point[1]);
				} else interpolate(current.x, current.p.x, -1, stream);
				current = current.p;
			}
			current = current.o;
			points = current.z;
			isSubject = !isSubject;
		} while (!current.v);
		stream.lineEnd();
	}
}
function link(array) {
	if (!(n = array.length)) return;
	var n, i = 0, a = array[0], b;
	while (++i < n) {
		a.n = b = array[i];
		b.p = a;
		a = b;
	}
	a.n = b = array[0];
	b.p = a;
}
//#endregion
//#region node_modules/d3-geo/src/polygonContains.js
function longitude(point) {
	return abs(point[0]) <= pi ? point[0] : sign(point[0]) * ((abs(point[0]) + pi) % tau - pi);
}
function polygonContains_default(polygon, point) {
	var lambda = longitude(point), phi = point[1], sinPhi = sin(phi), normal = [
		sin(lambda),
		-cos(lambda),
		0
	], angle = 0, winding = 0;
	var sum = new Adder();
	if (sinPhi === 1) phi = halfPi + epsilon;
	else if (sinPhi === -1) phi = -halfPi - epsilon;
	for (var i = 0, n = polygon.length; i < n; ++i) {
		if (!(m = (ring = polygon[i]).length)) continue;
		var ring, m, point0 = ring[m - 1], lambda0 = longitude(point0), phi0 = point0[1] / 2 + quarterPi, sinPhi0 = sin(phi0), cosPhi0 = cos(phi0);
		for (var j = 0; j < m; ++j, lambda0 = lambda1, sinPhi0 = sinPhi1, cosPhi0 = cosPhi1, point0 = point1) {
			var point1 = ring[j], lambda1 = longitude(point1), phi1 = point1[1] / 2 + quarterPi, sinPhi1 = sin(phi1), cosPhi1 = cos(phi1), delta = lambda1 - lambda0, sign = delta >= 0 ? 1 : -1, absDelta = sign * delta, antimeridian = absDelta > pi, k = sinPhi0 * sinPhi1;
			sum.add(atan2(k * sign * sin(absDelta), cosPhi0 * cosPhi1 + k * cos(absDelta)));
			angle += antimeridian ? delta + sign * tau : delta;
			if (antimeridian ^ lambda0 >= lambda ^ lambda1 >= lambda) {
				var arc = cartesianCross(cartesian(point0), cartesian(point1));
				cartesianNormalizeInPlace(arc);
				var intersection = cartesianCross(normal, arc);
				cartesianNormalizeInPlace(intersection);
				var phiArc = (antimeridian ^ delta >= 0 ? -1 : 1) * asin(intersection[2]);
				if (phi > phiArc || phi === phiArc && (arc[0] || arc[1])) winding += antimeridian ^ delta >= 0 ? 1 : -1;
			}
		}
	}
	return (angle < -1e-6 || angle < 1e-6 && sum < -1e-12) ^ winding & 1;
}
//#endregion
//#region node_modules/d3-geo/src/clip/index.js
function clip_default(pointVisible, clipLine, interpolate, start) {
	return function(sink) {
		var line = clipLine(sink), ringBuffer = buffer_default(), ringSink = clipLine(ringBuffer), polygonStarted = false, polygon, segments, ring;
		var clip = {
			point,
			lineStart,
			lineEnd,
			polygonStart: function() {
				clip.point = pointRing;
				clip.lineStart = ringStart;
				clip.lineEnd = ringEnd;
				segments = [];
				polygon = [];
			},
			polygonEnd: function() {
				clip.point = point;
				clip.lineStart = lineStart;
				clip.lineEnd = lineEnd;
				segments = merge(segments);
				var startInside = polygonContains_default(polygon, start);
				if (segments.length) {
					if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
					rejoin_default(segments, compareIntersection, startInside, interpolate, sink);
				} else if (startInside) {
					if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
					sink.lineStart();
					interpolate(null, null, 1, sink);
					sink.lineEnd();
				}
				if (polygonStarted) sink.polygonEnd(), polygonStarted = false;
				segments = polygon = null;
			},
			sphere: function() {
				sink.polygonStart();
				sink.lineStart();
				interpolate(null, null, 1, sink);
				sink.lineEnd();
				sink.polygonEnd();
			}
		};
		function point(lambda, phi) {
			if (pointVisible(lambda, phi)) sink.point(lambda, phi);
		}
		function pointLine(lambda, phi) {
			line.point(lambda, phi);
		}
		function lineStart() {
			clip.point = pointLine;
			line.lineStart();
		}
		function lineEnd() {
			clip.point = point;
			line.lineEnd();
		}
		function pointRing(lambda, phi) {
			ring.push([lambda, phi]);
			ringSink.point(lambda, phi);
		}
		function ringStart() {
			ringSink.lineStart();
			ring = [];
		}
		function ringEnd() {
			pointRing(ring[0][0], ring[0][1]);
			ringSink.lineEnd();
			var clean = ringSink.clean(), ringSegments = ringBuffer.result(), i, n = ringSegments.length, m, segment, point;
			ring.pop();
			polygon.push(ring);
			ring = null;
			if (!n) return;
			if (clean & 1) {
				segment = ringSegments[0];
				if ((m = segment.length - 1) > 0) {
					if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
					sink.lineStart();
					for (i = 0; i < m; ++i) sink.point((point = segment[i])[0], point[1]);
					sink.lineEnd();
				}
				return;
			}
			if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));
			segments.push(ringSegments.filter(validSegment));
		}
		return clip;
	};
}
function validSegment(segment) {
	return segment.length > 1;
}
function compareIntersection(a, b) {
	return ((a = a.x)[0] < 0 ? a[1] - halfPi - epsilon : halfPi - a[1]) - ((b = b.x)[0] < 0 ? b[1] - halfPi - epsilon : halfPi - b[1]);
}
//#endregion
//#region node_modules/d3-geo/src/clip/antimeridian.js
var antimeridian_default = clip_default(function() {
	return true;
}, clipAntimeridianLine, clipAntimeridianInterpolate, [-pi, -halfPi]);
function clipAntimeridianLine(stream) {
	var lambda0 = NaN, phi0 = NaN, sign0 = NaN, clean;
	return {
		lineStart: function() {
			stream.lineStart();
			clean = 1;
		},
		point: function(lambda1, phi1) {
			var sign1 = lambda1 > 0 ? pi : -pi, delta = abs(lambda1 - lambda0);
			if (abs(delta - pi) < 1e-6) {
				stream.point(lambda0, phi0 = (phi0 + phi1) / 2 > 0 ? halfPi : -halfPi);
				stream.point(sign0, phi0);
				stream.lineEnd();
				stream.lineStart();
				stream.point(sign1, phi0);
				stream.point(lambda1, phi0);
				clean = 0;
			} else if (sign0 !== sign1 && delta >= pi) {
				if (abs(lambda0 - sign0) < 1e-6) lambda0 -= sign0 * epsilon;
				if (abs(lambda1 - sign1) < 1e-6) lambda1 -= sign1 * epsilon;
				phi0 = clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1);
				stream.point(sign0, phi0);
				stream.lineEnd();
				stream.lineStart();
				stream.point(sign1, phi0);
				clean = 0;
			}
			stream.point(lambda0 = lambda1, phi0 = phi1);
			sign0 = sign1;
		},
		lineEnd: function() {
			stream.lineEnd();
			lambda0 = phi0 = NaN;
		},
		clean: function() {
			return 2 - clean;
		}
	};
}
function clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1) {
	var cosPhi0, cosPhi1, sinLambda0Lambda1 = sin(lambda0 - lambda1);
	return abs(sinLambda0Lambda1) > 1e-6 ? atan((sin(phi0) * (cosPhi1 = cos(phi1)) * sin(lambda1) - sin(phi1) * (cosPhi0 = cos(phi0)) * sin(lambda0)) / (cosPhi0 * cosPhi1 * sinLambda0Lambda1)) : (phi0 + phi1) / 2;
}
function clipAntimeridianInterpolate(from, to, direction, stream) {
	var phi;
	if (from == null) {
		phi = direction * halfPi;
		stream.point(-pi, phi);
		stream.point(0, phi);
		stream.point(pi, phi);
		stream.point(pi, 0);
		stream.point(pi, -phi);
		stream.point(0, -phi);
		stream.point(-pi, -phi);
		stream.point(-pi, 0);
		stream.point(-pi, phi);
	} else if (abs(from[0] - to[0]) > 1e-6) {
		var lambda = from[0] < to[0] ? pi : -pi;
		phi = direction * lambda / 2;
		stream.point(-lambda, phi);
		stream.point(0, phi);
		stream.point(lambda, phi);
	} else stream.point(to[0], to[1]);
}
//#endregion
//#region node_modules/d3-geo/src/clip/circle.js
function circle_default(radius) {
	var cr = cos(radius), delta = 2 * radians, smallRadius = cr > 0, notHemisphere = abs(cr) > epsilon;
	function interpolate(from, to, direction, stream) {
		circleStream(stream, radius, delta, direction, from, to);
	}
	function visible(lambda, phi) {
		return cos(lambda) * cos(phi) > cr;
	}
	function clipLine(stream) {
		var point0, c0, v0, v00, clean;
		return {
			lineStart: function() {
				v00 = v0 = false;
				clean = 1;
			},
			point: function(lambda, phi) {
				var point1 = [lambda, phi], point2, v = visible(lambda, phi), c = smallRadius ? v ? 0 : code(lambda, phi) : v ? code(lambda + (lambda < 0 ? pi : -pi), phi) : 0;
				if (!point0 && (v00 = v0 = v)) stream.lineStart();
				if (v !== v0) {
					point2 = intersect(point0, point1);
					if (!point2 || pointEqual_default(point0, point2) || pointEqual_default(point1, point2)) point1[2] = 1;
				}
				if (v !== v0) {
					clean = 0;
					if (v) {
						stream.lineStart();
						point2 = intersect(point1, point0);
						stream.point(point2[0], point2[1]);
					} else {
						point2 = intersect(point0, point1);
						stream.point(point2[0], point2[1], 2);
						stream.lineEnd();
					}
					point0 = point2;
				} else if (notHemisphere && point0 && smallRadius ^ v) {
					var t;
					if (!(c & c0) && (t = intersect(point1, point0, true))) {
						clean = 0;
						if (smallRadius) {
							stream.lineStart();
							stream.point(t[0][0], t[0][1]);
							stream.point(t[1][0], t[1][1]);
							stream.lineEnd();
						} else {
							stream.point(t[1][0], t[1][1]);
							stream.lineEnd();
							stream.lineStart();
							stream.point(t[0][0], t[0][1], 3);
						}
					}
				}
				if (v && (!point0 || !pointEqual_default(point0, point1))) stream.point(point1[0], point1[1]);
				point0 = point1, v0 = v, c0 = c;
			},
			lineEnd: function() {
				if (v0) stream.lineEnd();
				point0 = null;
			},
			clean: function() {
				return clean | (v00 && v0) << 1;
			}
		};
	}
	function intersect(a, b, two) {
		var pa = cartesian(a), pb = cartesian(b);
		var n1 = [
			1,
			0,
			0
		], n2 = cartesianCross(pa, pb), n2n2 = cartesianDot(n2, n2), n1n2 = n2[0], determinant = n2n2 - n1n2 * n1n2;
		if (!determinant) return !two && a;
		var c1 = cr * n2n2 / determinant, c2 = -cr * n1n2 / determinant, n1xn2 = cartesianCross(n1, n2), A = cartesianScale(n1, c1);
		cartesianAddInPlace(A, cartesianScale(n2, c2));
		var u = n1xn2, w = cartesianDot(A, u), uu = cartesianDot(u, u), t2 = w * w - uu * (cartesianDot(A, A) - 1);
		if (t2 < 0) return;
		var t = sqrt(t2), q = cartesianScale(u, (-w - t) / uu);
		cartesianAddInPlace(q, A);
		q = spherical(q);
		if (!two) return q;
		var lambda0 = a[0], lambda1 = b[0], phi0 = a[1], phi1 = b[1], z;
		if (lambda1 < lambda0) z = lambda0, lambda0 = lambda1, lambda1 = z;
		var delta = lambda1 - lambda0, polar = abs(delta - pi) < epsilon, meridian = polar || delta < 1e-6;
		if (!polar && phi1 < phi0) z = phi0, phi0 = phi1, phi1 = z;
		if (meridian ? polar ? phi0 + phi1 > 0 ^ q[1] < (abs(q[0] - lambda0) < 1e-6 ? phi0 : phi1) : phi0 <= q[1] && q[1] <= phi1 : delta > pi ^ (lambda0 <= q[0] && q[0] <= lambda1)) {
			var q1 = cartesianScale(u, (-w + t) / uu);
			cartesianAddInPlace(q1, A);
			return [q, spherical(q1)];
		}
	}
	function code(lambda, phi) {
		var r = smallRadius ? radius : pi - radius, code = 0;
		if (lambda < -r) code |= 1;
		else if (lambda > r) code |= 2;
		if (phi < -r) code |= 4;
		else if (phi > r) code |= 8;
		return code;
	}
	return clip_default(visible, clipLine, interpolate, smallRadius ? [0, -radius] : [-pi, radius - pi]);
}
//#endregion
//#region node_modules/d3-geo/src/clip/line.js
function line_default(a, b, x0, y0, x1, y1) {
	var ax = a[0], ay = a[1], bx = b[0], by = b[1], t0 = 0, t1 = 1, dx = bx - ax, dy = by - ay, r = x0 - ax;
	if (!dx && r > 0) return;
	r /= dx;
	if (dx < 0) {
		if (r < t0) return;
		if (r < t1) t1 = r;
	} else if (dx > 0) {
		if (r > t1) return;
		if (r > t0) t0 = r;
	}
	r = x1 - ax;
	if (!dx && r < 0) return;
	r /= dx;
	if (dx < 0) {
		if (r > t1) return;
		if (r > t0) t0 = r;
	} else if (dx > 0) {
		if (r < t0) return;
		if (r < t1) t1 = r;
	}
	r = y0 - ay;
	if (!dy && r > 0) return;
	r /= dy;
	if (dy < 0) {
		if (r < t0) return;
		if (r < t1) t1 = r;
	} else if (dy > 0) {
		if (r > t1) return;
		if (r > t0) t0 = r;
	}
	r = y1 - ay;
	if (!dy && r < 0) return;
	r /= dy;
	if (dy < 0) {
		if (r > t1) return;
		if (r > t0) t0 = r;
	} else if (dy > 0) {
		if (r < t0) return;
		if (r < t1) t1 = r;
	}
	if (t0 > 0) a[0] = ax + t0 * dx, a[1] = ay + t0 * dy;
	if (t1 < 1) b[0] = ax + t1 * dx, b[1] = ay + t1 * dy;
	return true;
}
//#endregion
//#region node_modules/d3-geo/src/clip/rectangle.js
var clipMax = 1e9;
var clipMin = -clipMax;
function clipRectangle(x0, y0, x1, y1) {
	function visible(x, y) {
		return x0 <= x && x <= x1 && y0 <= y && y <= y1;
	}
	function interpolate(from, to, direction, stream) {
		var a = 0, a1 = 0;
		if (from == null || (a = corner(from, direction)) !== (a1 = corner(to, direction)) || comparePoint(from, to) < 0 ^ direction > 0) do
			stream.point(a === 0 || a === 3 ? x0 : x1, a > 1 ? y1 : y0);
		while ((a = (a + direction + 4) % 4) !== a1);
		else stream.point(to[0], to[1]);
	}
	function corner(p, direction) {
		return abs(p[0] - x0) < 1e-6 ? direction > 0 ? 0 : 3 : abs(p[0] - x1) < 1e-6 ? direction > 0 ? 2 : 1 : abs(p[1] - y0) < 1e-6 ? direction > 0 ? 1 : 0 : direction > 0 ? 3 : 2;
	}
	function compareIntersection(a, b) {
		return comparePoint(a.x, b.x);
	}
	function comparePoint(a, b) {
		var ca = corner(a, 1), cb = corner(b, 1);
		return ca !== cb ? ca - cb : ca === 0 ? b[1] - a[1] : ca === 1 ? a[0] - b[0] : ca === 2 ? a[1] - b[1] : b[0] - a[0];
	}
	return function(stream) {
		var activeStream = stream, bufferStream = buffer_default(), segments, polygon, ring, x__, y__, v__, x_, y_, v_, first, clean;
		var clipStream = {
			point,
			lineStart,
			lineEnd,
			polygonStart,
			polygonEnd
		};
		function point(x, y) {
			if (visible(x, y)) activeStream.point(x, y);
		}
		function polygonInside() {
			var winding = 0;
			for (var i = 0, n = polygon.length; i < n; ++i) for (var ring = polygon[i], j = 1, m = ring.length, point = ring[0], a0, a1, b0 = point[0], b1 = point[1]; j < m; ++j) {
				a0 = b0, a1 = b1, point = ring[j], b0 = point[0], b1 = point[1];
				if (a1 <= y1) {
					if (b1 > y1 && (b0 - a0) * (y1 - a1) > (b1 - a1) * (x0 - a0)) ++winding;
				} else if (b1 <= y1 && (b0 - a0) * (y1 - a1) < (b1 - a1) * (x0 - a0)) --winding;
			}
			return winding;
		}
		function polygonStart() {
			activeStream = bufferStream, segments = [], polygon = [], clean = true;
		}
		function polygonEnd() {
			var startInside = polygonInside(), cleanInside = clean && startInside, visible = (segments = merge(segments)).length;
			if (cleanInside || visible) {
				stream.polygonStart();
				if (cleanInside) {
					stream.lineStart();
					interpolate(null, null, 1, stream);
					stream.lineEnd();
				}
				if (visible) rejoin_default(segments, compareIntersection, startInside, interpolate, stream);
				stream.polygonEnd();
			}
			activeStream = stream, segments = polygon = ring = null;
		}
		function lineStart() {
			clipStream.point = linePoint;
			if (polygon) polygon.push(ring = []);
			first = true;
			v_ = false;
			x_ = y_ = NaN;
		}
		function lineEnd() {
			if (segments) {
				linePoint(x__, y__);
				if (v__ && v_) bufferStream.rejoin();
				segments.push(bufferStream.result());
			}
			clipStream.point = point;
			if (v_) activeStream.lineEnd();
		}
		function linePoint(x, y) {
			var v = visible(x, y);
			if (polygon) ring.push([x, y]);
			if (first) {
				x__ = x, y__ = y, v__ = v;
				first = false;
				if (v) {
					activeStream.lineStart();
					activeStream.point(x, y);
				}
			} else if (v && v_) activeStream.point(x, y);
			else {
				var a = [x_ = Math.max(clipMin, Math.min(clipMax, x_)), y_ = Math.max(clipMin, Math.min(clipMax, y_))], b = [x = Math.max(clipMin, Math.min(clipMax, x)), y = Math.max(clipMin, Math.min(clipMax, y))];
				if (line_default(a, b, x0, y0, x1, y1)) {
					if (!v_) {
						activeStream.lineStart();
						activeStream.point(a[0], a[1]);
					}
					activeStream.point(b[0], b[1]);
					if (!v) activeStream.lineEnd();
					clean = false;
				} else if (v) {
					activeStream.lineStart();
					activeStream.point(x, y);
					clean = false;
				}
			}
			x_ = x, y_ = y, v_ = v;
		}
		return clipStream;
	};
}
//#endregion
//#region node_modules/d3-geo/src/length.js
var lengthSum$1;
var lambda0;
var sinPhi0;
var cosPhi0;
var lengthStream$1 = {
	sphere: noop,
	point: noop,
	lineStart: lengthLineStart,
	lineEnd: noop,
	polygonStart: noop,
	polygonEnd: noop
};
function lengthLineStart() {
	lengthStream$1.point = lengthPointFirst$1;
	lengthStream$1.lineEnd = lengthLineEnd;
}
function lengthLineEnd() {
	lengthStream$1.point = lengthStream$1.lineEnd = noop;
}
function lengthPointFirst$1(lambda, phi) {
	lambda *= radians, phi *= radians;
	lambda0 = lambda, sinPhi0 = sin(phi), cosPhi0 = cos(phi);
	lengthStream$1.point = lengthPoint$1;
}
function lengthPoint$1(lambda, phi) {
	lambda *= radians, phi *= radians;
	var sinPhi = sin(phi), cosPhi = cos(phi), delta = abs(lambda - lambda0), cosDelta = cos(delta), x = cosPhi * sin(delta), y = cosPhi0 * sinPhi - sinPhi0 * cosPhi * cosDelta, z = sinPhi0 * sinPhi + cosPhi0 * cosPhi * cosDelta;
	lengthSum$1.add(atan2(sqrt(x * x + y * y), z));
	lambda0 = lambda, sinPhi0 = sinPhi, cosPhi0 = cosPhi;
}
function length_default(object) {
	lengthSum$1 = new Adder();
	stream_default(object, lengthStream$1);
	return +lengthSum$1;
}
//#endregion
//#region node_modules/d3-geo/src/distance.js
var coordinates = [null, null];
var object = {
	type: "LineString",
	coordinates
};
function distance_default(a, b) {
	coordinates[0] = a;
	coordinates[1] = b;
	return length_default(object);
}
//#endregion
//#region node_modules/d3-geo/src/graticule.js
function graticuleX(y0, y1, dy) {
	var y = range(y0, y1 - epsilon, dy).concat(y1);
	return function(x) {
		return y.map(function(y) {
			return [x, y];
		});
	};
}
function graticuleY(x0, x1, dx) {
	var x = range(x0, x1 - epsilon, dx).concat(x1);
	return function(y) {
		return x.map(function(x) {
			return [x, y];
		});
	};
}
function graticule() {
	var x1, x0, X1, X0, y1, y0, Y1, Y0, dx = 10, dy = dx, DX = 90, DY = 360, x, y, X, Y, precision = 2.5;
	function graticule() {
		return {
			type: "MultiLineString",
			coordinates: lines()
		};
	}
	function lines() {
		return range(ceil(X0 / DX) * DX, X1, DX).map(X).concat(range(ceil(Y0 / DY) * DY, Y1, DY).map(Y)).concat(range(ceil(x0 / dx) * dx, x1, dx).filter(function(x) {
			return abs(x % DX) > epsilon;
		}).map(x)).concat(range(ceil(y0 / dy) * dy, y1, dy).filter(function(y) {
			return abs(y % DY) > epsilon;
		}).map(y));
	}
	graticule.lines = function() {
		return lines().map(function(coordinates) {
			return {
				type: "LineString",
				coordinates
			};
		});
	};
	graticule.outline = function() {
		return {
			type: "Polygon",
			coordinates: [X(X0).concat(Y(Y1).slice(1), X(X1).reverse().slice(1), Y(Y0).reverse().slice(1))]
		};
	};
	graticule.extent = function(_) {
		if (!arguments.length) return graticule.extentMinor();
		return graticule.extentMajor(_).extentMinor(_);
	};
	graticule.extentMajor = function(_) {
		if (!arguments.length) return [[X0, Y0], [X1, Y1]];
		X0 = +_[0][0], X1 = +_[1][0];
		Y0 = +_[0][1], Y1 = +_[1][1];
		if (X0 > X1) _ = X0, X0 = X1, X1 = _;
		if (Y0 > Y1) _ = Y0, Y0 = Y1, Y1 = _;
		return graticule.precision(precision);
	};
	graticule.extentMinor = function(_) {
		if (!arguments.length) return [[x0, y0], [x1, y1]];
		x0 = +_[0][0], x1 = +_[1][0];
		y0 = +_[0][1], y1 = +_[1][1];
		if (x0 > x1) _ = x0, x0 = x1, x1 = _;
		if (y0 > y1) _ = y0, y0 = y1, y1 = _;
		return graticule.precision(precision);
	};
	graticule.step = function(_) {
		if (!arguments.length) return graticule.stepMinor();
		return graticule.stepMajor(_).stepMinor(_);
	};
	graticule.stepMajor = function(_) {
		if (!arguments.length) return [DX, DY];
		DX = +_[0], DY = +_[1];
		return graticule;
	};
	graticule.stepMinor = function(_) {
		if (!arguments.length) return [dx, dy];
		dx = +_[0], dy = +_[1];
		return graticule;
	};
	graticule.precision = function(_) {
		if (!arguments.length) return precision;
		precision = +_;
		x = graticuleX(y0, y1, 90);
		y = graticuleY(x0, x1, precision);
		X = graticuleX(Y0, Y1, 90);
		Y = graticuleY(X0, X1, precision);
		return graticule;
	};
	return graticule.extentMajor([[-180, -90 + epsilon], [180, 90 - epsilon]]).extentMinor([[-180, -80 - epsilon], [180, 80 + epsilon]]);
}
//#endregion
//#region node_modules/d3-geo/src/identity.js
var identity_default = (x) => x;
//#endregion
//#region node_modules/d3-geo/src/path/area.js
var areaSum = new Adder();
var areaRingSum = new Adder();
var x00$2;
var y00$2;
var x0$3;
var y0$3;
var areaStream = {
	point: noop,
	lineStart: noop,
	lineEnd: noop,
	polygonStart: function() {
		areaStream.lineStart = areaRingStart;
		areaStream.lineEnd = areaRingEnd;
	},
	polygonEnd: function() {
		areaStream.lineStart = areaStream.lineEnd = areaStream.point = noop;
		areaSum.add(abs(areaRingSum));
		areaRingSum = new Adder();
	},
	result: function() {
		var area = areaSum / 2;
		areaSum = new Adder();
		return area;
	}
};
function areaRingStart() {
	areaStream.point = areaPointFirst;
}
function areaPointFirst(x, y) {
	areaStream.point = areaPoint;
	x00$2 = x0$3 = x, y00$2 = y0$3 = y;
}
function areaPoint(x, y) {
	areaRingSum.add(y0$3 * x - x0$3 * y);
	x0$3 = x, y0$3 = y;
}
function areaRingEnd() {
	areaPoint(x00$2, y00$2);
}
//#endregion
//#region node_modules/d3-geo/src/path/bounds.js
var x0$2 = Infinity;
var y0$2 = x0$2;
var x1 = -x0$2;
var y1 = x1;
var boundsStream = {
	point: boundsPoint,
	lineStart: noop,
	lineEnd: noop,
	polygonStart: noop,
	polygonEnd: noop,
	result: function() {
		var bounds = [[x0$2, y0$2], [x1, y1]];
		x1 = y1 = -(y0$2 = x0$2 = Infinity);
		return bounds;
	}
};
function boundsPoint(x, y) {
	if (x < x0$2) x0$2 = x;
	if (x > x1) x1 = x;
	if (y < y0$2) y0$2 = y;
	if (y > y1) y1 = y;
}
//#endregion
//#region node_modules/d3-geo/src/path/centroid.js
var X0 = 0;
var Y0 = 0;
var Z0 = 0;
var X1 = 0;
var Y1 = 0;
var Z1 = 0;
var X2 = 0;
var Y2 = 0;
var Z2 = 0;
var x00$1;
var y00$1;
var x0$1;
var y0$1;
var centroidStream = {
	point: centroidPoint,
	lineStart: centroidLineStart,
	lineEnd: centroidLineEnd,
	polygonStart: function() {
		centroidStream.lineStart = centroidRingStart;
		centroidStream.lineEnd = centroidRingEnd;
	},
	polygonEnd: function() {
		centroidStream.point = centroidPoint;
		centroidStream.lineStart = centroidLineStart;
		centroidStream.lineEnd = centroidLineEnd;
	},
	result: function() {
		var centroid = Z2 ? [X2 / Z2, Y2 / Z2] : Z1 ? [X1 / Z1, Y1 / Z1] : Z0 ? [X0 / Z0, Y0 / Z0] : [NaN, NaN];
		X0 = Y0 = Z0 = X1 = Y1 = Z1 = X2 = Y2 = Z2 = 0;
		return centroid;
	}
};
function centroidPoint(x, y) {
	X0 += x;
	Y0 += y;
	++Z0;
}
function centroidLineStart() {
	centroidStream.point = centroidPointFirstLine;
}
function centroidPointFirstLine(x, y) {
	centroidStream.point = centroidPointLine;
	centroidPoint(x0$1 = x, y0$1 = y);
}
function centroidPointLine(x, y) {
	var dx = x - x0$1, dy = y - y0$1, z = sqrt(dx * dx + dy * dy);
	X1 += z * (x0$1 + x) / 2;
	Y1 += z * (y0$1 + y) / 2;
	Z1 += z;
	centroidPoint(x0$1 = x, y0$1 = y);
}
function centroidLineEnd() {
	centroidStream.point = centroidPoint;
}
function centroidRingStart() {
	centroidStream.point = centroidPointFirstRing;
}
function centroidRingEnd() {
	centroidPointRing(x00$1, y00$1);
}
function centroidPointFirstRing(x, y) {
	centroidStream.point = centroidPointRing;
	centroidPoint(x00$1 = x0$1 = x, y00$1 = y0$1 = y);
}
function centroidPointRing(x, y) {
	var dx = x - x0$1, dy = y - y0$1, z = sqrt(dx * dx + dy * dy);
	X1 += z * (x0$1 + x) / 2;
	Y1 += z * (y0$1 + y) / 2;
	Z1 += z;
	z = y0$1 * x - x0$1 * y;
	X2 += z * (x0$1 + x);
	Y2 += z * (y0$1 + y);
	Z2 += z * 3;
	centroidPoint(x0$1 = x, y0$1 = y);
}
//#endregion
//#region node_modules/d3-geo/src/path/context.js
function PathContext(context) {
	this._context = context;
}
PathContext.prototype = {
	_radius: 4.5,
	pointRadius: function(_) {
		return this._radius = _, this;
	},
	polygonStart: function() {
		this._line = 0;
	},
	polygonEnd: function() {
		this._line = NaN;
	},
	lineStart: function() {
		this._point = 0;
	},
	lineEnd: function() {
		if (this._line === 0) this._context.closePath();
		this._point = NaN;
	},
	point: function(x, y) {
		switch (this._point) {
			case 0:
				this._context.moveTo(x, y);
				this._point = 1;
				break;
			case 1:
				this._context.lineTo(x, y);
				break;
			default:
				this._context.moveTo(x + this._radius, y);
				this._context.arc(x, y, this._radius, 0, tau);
		}
	},
	result: noop
};
//#endregion
//#region node_modules/d3-geo/src/path/measure.js
var lengthSum = new Adder();
var lengthRing;
var x00;
var y00;
var x0;
var y0;
var lengthStream = {
	point: noop,
	lineStart: function() {
		lengthStream.point = lengthPointFirst;
	},
	lineEnd: function() {
		if (lengthRing) lengthPoint(x00, y00);
		lengthStream.point = noop;
	},
	polygonStart: function() {
		lengthRing = true;
	},
	polygonEnd: function() {
		lengthRing = null;
	},
	result: function() {
		var length = +lengthSum;
		lengthSum = new Adder();
		return length;
	}
};
function lengthPointFirst(x, y) {
	lengthStream.point = lengthPoint;
	x00 = x0 = x, y00 = y0 = y;
}
function lengthPoint(x, y) {
	x0 -= x, y0 -= y;
	lengthSum.add(sqrt(x0 * x0 + y0 * y0));
	x0 = x, y0 = y;
}
//#endregion
//#region node_modules/d3-geo/src/path/string.js
var cacheDigits;
var cacheAppend;
var cacheRadius;
var cacheCircle;
var PathString = class {
	constructor(digits) {
		this._append = digits == null ? append : appendRound(digits);
		this._radius = 4.5;
		this._ = "";
	}
	pointRadius(_) {
		this._radius = +_;
		return this;
	}
	polygonStart() {
		this._line = 0;
	}
	polygonEnd() {
		this._line = NaN;
	}
	lineStart() {
		this._point = 0;
	}
	lineEnd() {
		if (this._line === 0) this._ += "Z";
		this._point = NaN;
	}
	point(x, y) {
		switch (this._point) {
			case 0:
				this._append`M${x},${y}`;
				this._point = 1;
				break;
			case 1:
				this._append`L${x},${y}`;
				break;
			default:
				this._append`M${x},${y}`;
				if (this._radius !== cacheRadius || this._append !== cacheAppend) {
					const r = this._radius;
					const s = this._;
					this._ = "";
					this._append`m0,${r}a${r},${r} 0 1,1 0,${-2 * r}a${r},${r} 0 1,1 0,${2 * r}z`;
					cacheRadius = r;
					cacheAppend = this._append;
					cacheCircle = this._;
					this._ = s;
				}
				this._ += cacheCircle;
		}
	}
	result() {
		const result = this._;
		this._ = "";
		return result.length ? result : null;
	}
};
function append(strings) {
	let i = 1;
	this._ += strings[0];
	for (const j = strings.length; i < j; ++i) this._ += arguments[i] + strings[i];
}
function appendRound(digits) {
	const d = Math.floor(digits);
	if (!(d >= 0)) throw new RangeError(`invalid digits: ${digits}`);
	if (d > 15) return append;
	if (d !== cacheDigits) {
		const k = 10 ** d;
		cacheDigits = d;
		cacheAppend = function append(strings) {
			let i = 1;
			this._ += strings[0];
			for (const j = strings.length; i < j; ++i) this._ += Math.round(arguments[i] * k) / k + strings[i];
		};
	}
	return cacheAppend;
}
//#endregion
//#region node_modules/d3-geo/src/path/index.js
function path_default(projection, context) {
	let digits = 3, pointRadius = 4.5, projectionStream, contextStream;
	function path(object) {
		if (object) {
			if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments));
			stream_default(object, projectionStream(contextStream));
		}
		return contextStream.result();
	}
	path.area = function(object) {
		stream_default(object, projectionStream(areaStream));
		return areaStream.result();
	};
	path.measure = function(object) {
		stream_default(object, projectionStream(lengthStream));
		return lengthStream.result();
	};
	path.bounds = function(object) {
		stream_default(object, projectionStream(boundsStream));
		return boundsStream.result();
	};
	path.centroid = function(object) {
		stream_default(object, projectionStream(centroidStream));
		return centroidStream.result();
	};
	path.projection = function(_) {
		if (!arguments.length) return projection;
		projectionStream = _ == null ? (projection = null, identity_default) : (projection = _).stream;
		return path;
	};
	path.context = function(_) {
		if (!arguments.length) return context;
		contextStream = _ == null ? (context = null, new PathString(digits)) : new PathContext(context = _);
		if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius);
		return path;
	};
	path.pointRadius = function(_) {
		if (!arguments.length) return pointRadius;
		pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_);
		return path;
	};
	path.digits = function(_) {
		if (!arguments.length) return digits;
		if (_ == null) digits = null;
		else {
			const d = Math.floor(_);
			if (!(d >= 0)) throw new RangeError(`invalid digits: ${_}`);
			digits = d;
		}
		if (context === null) contextStream = new PathString(digits);
		return path;
	};
	return path.projection(projection).digits(digits).context(context);
}
//#endregion
//#region node_modules/d3-geo/src/transform.js
function transformer(methods) {
	return function(stream) {
		var s = new TransformStream();
		for (var key in methods) s[key] = methods[key];
		s.stream = stream;
		return s;
	};
}
function TransformStream() {}
TransformStream.prototype = {
	constructor: TransformStream,
	point: function(x, y) {
		this.stream.point(x, y);
	},
	sphere: function() {
		this.stream.sphere();
	},
	lineStart: function() {
		this.stream.lineStart();
	},
	lineEnd: function() {
		this.stream.lineEnd();
	},
	polygonStart: function() {
		this.stream.polygonStart();
	},
	polygonEnd: function() {
		this.stream.polygonEnd();
	}
};
//#endregion
//#region node_modules/d3-geo/src/projection/fit.js
function fit(projection, fitBounds, object) {
	var clip = projection.clipExtent && projection.clipExtent();
	projection.scale(150).translate([0, 0]);
	if (clip != null) projection.clipExtent(null);
	stream_default(object, projection.stream(boundsStream));
	fitBounds(boundsStream.result());
	if (clip != null) projection.clipExtent(clip);
	return projection;
}
function fitExtent(projection, extent, object) {
	return fit(projection, function(b) {
		var w = extent[1][0] - extent[0][0], h = extent[1][1] - extent[0][1], k = Math.min(w / (b[1][0] - b[0][0]), h / (b[1][1] - b[0][1])), x = +extent[0][0] + (w - k * (b[1][0] + b[0][0])) / 2, y = +extent[0][1] + (h - k * (b[1][1] + b[0][1])) / 2;
		projection.scale(150 * k).translate([x, y]);
	}, object);
}
function fitSize(projection, size, object) {
	return fitExtent(projection, [[0, 0], size], object);
}
function fitWidth(projection, width, object) {
	return fit(projection, function(b) {
		var w = +width, k = w / (b[1][0] - b[0][0]), x = (w - k * (b[1][0] + b[0][0])) / 2, y = -k * b[0][1];
		projection.scale(150 * k).translate([x, y]);
	}, object);
}
function fitHeight(projection, height, object) {
	return fit(projection, function(b) {
		var h = +height, k = h / (b[1][1] - b[0][1]), x = -k * b[0][0], y = (h - k * (b[1][1] + b[0][1])) / 2;
		projection.scale(150 * k).translate([x, y]);
	}, object);
}
//#endregion
//#region node_modules/d3-geo/src/projection/resample.js
var maxDepth = 16;
var cosMinDistance = cos(30 * radians);
function resample_default(project, delta2) {
	return +delta2 ? resample(project, delta2) : resampleNone(project);
}
function resampleNone(project) {
	return transformer({ point: function(x, y) {
		x = project(x, y);
		this.stream.point(x[0], x[1]);
	} });
}
function resample(project, delta2) {
	function resampleLineTo(x0, y0, lambda0, a0, b0, c0, x1, y1, lambda1, a1, b1, c1, depth, stream) {
		var dx = x1 - x0, dy = y1 - y0, d2 = dx * dx + dy * dy;
		if (d2 > 4 * delta2 && depth--) {
			var a = a0 + a1, b = b0 + b1, c = c0 + c1, m = sqrt(a * a + b * b + c * c), phi2 = asin(c /= m), lambda2 = abs(abs(c) - 1) < 1e-6 || abs(lambda0 - lambda1) < 1e-6 ? (lambda0 + lambda1) / 2 : atan2(b, a), p = project(lambda2, phi2), x2 = p[0], y2 = p[1], dx2 = x2 - x0, dy2 = y2 - y0, dz = dy * dx2 - dx * dy2;
			if (dz * dz / d2 > delta2 || abs((dx * dx2 + dy * dy2) / d2 - .5) > .3 || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) {
				resampleLineTo(x0, y0, lambda0, a0, b0, c0, x2, y2, lambda2, a /= m, b /= m, c, depth, stream);
				stream.point(x2, y2);
				resampleLineTo(x2, y2, lambda2, a, b, c, x1, y1, lambda1, a1, b1, c1, depth, stream);
			}
		}
	}
	return function(stream) {
		var lambda00, x00, y00, a00, b00, c00, lambda0, x0, y0, a0, b0, c0;
		var resampleStream = {
			point,
			lineStart,
			lineEnd,
			polygonStart: function() {
				stream.polygonStart();
				resampleStream.lineStart = ringStart;
			},
			polygonEnd: function() {
				stream.polygonEnd();
				resampleStream.lineStart = lineStart;
			}
		};
		function point(x, y) {
			x = project(x, y);
			stream.point(x[0], x[1]);
		}
		function lineStart() {
			x0 = NaN;
			resampleStream.point = linePoint;
			stream.lineStart();
		}
		function linePoint(lambda, phi) {
			var c = cartesian([lambda, phi]), p = project(lambda, phi);
			resampleLineTo(x0, y0, lambda0, a0, b0, c0, x0 = p[0], y0 = p[1], lambda0 = lambda, a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);
			stream.point(x0, y0);
		}
		function lineEnd() {
			resampleStream.point = point;
			stream.lineEnd();
		}
		function ringStart() {
			lineStart();
			resampleStream.point = ringPoint;
			resampleStream.lineEnd = ringEnd;
		}
		function ringPoint(lambda, phi) {
			linePoint(lambda00 = lambda, phi), x00 = x0, y00 = y0, a00 = a0, b00 = b0, c00 = c0;
			resampleStream.point = linePoint;
		}
		function ringEnd() {
			resampleLineTo(x0, y0, lambda0, a0, b0, c0, x00, y00, lambda00, a00, b00, c00, maxDepth, stream);
			resampleStream.lineEnd = lineEnd;
			lineEnd();
		}
		return resampleStream;
	};
}
//#endregion
//#region node_modules/d3-geo/src/projection/index.js
var transformRadians = transformer({ point: function(x, y) {
	this.stream.point(x * radians, y * radians);
} });
function transformRotate(rotate) {
	return transformer({ point: function(x, y) {
		var r = rotate(x, y);
		return this.stream.point(r[0], r[1]);
	} });
}
function scaleTranslate(k, dx, dy, sx, sy) {
	function transform(x, y) {
		x *= sx;
		y *= sy;
		return [dx + k * x, dy - k * y];
	}
	transform.invert = function(x, y) {
		return [(x - dx) / k * sx, (dy - y) / k * sy];
	};
	return transform;
}
function scaleTranslateRotate(k, dx, dy, sx, sy, alpha) {
	if (!alpha) return scaleTranslate(k, dx, dy, sx, sy);
	var cosAlpha = cos(alpha), sinAlpha = sin(alpha), a = cosAlpha * k, b = sinAlpha * k, ai = cosAlpha / k, bi = sinAlpha / k, ci = (sinAlpha * dy - cosAlpha * dx) / k, fi = (sinAlpha * dx + cosAlpha * dy) / k;
	function transform(x, y) {
		x *= sx;
		y *= sy;
		return [a * x - b * y + dx, dy - b * x - a * y];
	}
	transform.invert = function(x, y) {
		return [sx * (ai * x - bi * y + ci), sy * (fi - bi * x - ai * y)];
	};
	return transform;
}
function projection(project) {
	return projectionMutator(function() {
		return project;
	})();
}
function projectionMutator(projectAt) {
	var project, k = 150, x = 480, y = 250, lambda = 0, phi = 0, deltaLambda = 0, deltaPhi = 0, deltaGamma = 0, rotate, alpha = 0, sx = 1, sy = 1, theta = null, preclip = antimeridian_default, x0 = null, y0, x1, y1, postclip = identity_default, delta2 = .5, projectResample, projectTransform, projectRotateTransform, cache, cacheStream;
	function projection(point) {
		return projectRotateTransform(point[0] * radians, point[1] * radians);
	}
	function invert(point) {
		point = projectRotateTransform.invert(point[0], point[1]);
		return point && [point[0] * degrees, point[1] * degrees];
	}
	projection.stream = function(stream) {
		return cache && cacheStream === stream ? cache : cache = transformRadians(transformRotate(rotate)(preclip(projectResample(postclip(cacheStream = stream)))));
	};
	projection.preclip = function(_) {
		return arguments.length ? (preclip = _, theta = void 0, reset()) : preclip;
	};
	projection.postclip = function(_) {
		return arguments.length ? (postclip = _, x0 = y0 = x1 = y1 = null, reset()) : postclip;
	};
	projection.clipAngle = function(_) {
		return arguments.length ? (preclip = +_ ? circle_default(theta = _ * radians) : (theta = null, antimeridian_default), reset()) : theta * degrees;
	};
	projection.clipExtent = function(_) {
		return arguments.length ? (postclip = _ == null ? (x0 = y0 = x1 = y1 = null, identity_default) : clipRectangle(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]), reset()) : x0 == null ? null : [[x0, y0], [x1, y1]];
	};
	projection.scale = function(_) {
		return arguments.length ? (k = +_, recenter()) : k;
	};
	projection.translate = function(_) {
		return arguments.length ? (x = +_[0], y = +_[1], recenter()) : [x, y];
	};
	projection.center = function(_) {
		return arguments.length ? (lambda = _[0] % 360 * radians, phi = _[1] % 360 * radians, recenter()) : [lambda * degrees, phi * degrees];
	};
	projection.rotate = function(_) {
		return arguments.length ? (deltaLambda = _[0] % 360 * radians, deltaPhi = _[1] % 360 * radians, deltaGamma = _.length > 2 ? _[2] % 360 * radians : 0, recenter()) : [
			deltaLambda * degrees,
			deltaPhi * degrees,
			deltaGamma * degrees
		];
	};
	projection.angle = function(_) {
		return arguments.length ? (alpha = _ % 360 * radians, recenter()) : alpha * degrees;
	};
	projection.reflectX = function(_) {
		return arguments.length ? (sx = _ ? -1 : 1, recenter()) : sx < 0;
	};
	projection.reflectY = function(_) {
		return arguments.length ? (sy = _ ? -1 : 1, recenter()) : sy < 0;
	};
	projection.precision = function(_) {
		return arguments.length ? (projectResample = resample_default(projectTransform, delta2 = _ * _), reset()) : sqrt(delta2);
	};
	projection.fitExtent = function(extent, object) {
		return fitExtent(projection, extent, object);
	};
	projection.fitSize = function(size, object) {
		return fitSize(projection, size, object);
	};
	projection.fitWidth = function(width, object) {
		return fitWidth(projection, width, object);
	};
	projection.fitHeight = function(height, object) {
		return fitHeight(projection, height, object);
	};
	function recenter() {
		var center = scaleTranslateRotate(k, 0, 0, sx, sy, alpha).apply(null, project(lambda, phi)), transform = scaleTranslateRotate(k, x - center[0], y - center[1], sx, sy, alpha);
		rotate = rotateRadians(deltaLambda, deltaPhi, deltaGamma);
		projectTransform = compose_default(project, transform);
		projectRotateTransform = compose_default(rotate, projectTransform);
		projectResample = resample_default(projectTransform, delta2);
		return reset();
	}
	function reset() {
		cache = cacheStream = null;
		return projection;
	}
	return function() {
		project = projectAt.apply(this, arguments);
		projection.invert = project.invert && invert;
		return recenter();
	};
}
//#endregion
//#region node_modules/d3-geo/src/projection/mercator.js
function mercatorRaw(lambda, phi) {
	return [lambda, log(tan((halfPi + phi) / 2))];
}
mercatorRaw.invert = function(x, y) {
	return [x, 2 * atan(exp(y)) - halfPi];
};
function mercator_default() {
	return mercatorProjection(mercatorRaw).scale(961 / tau);
}
function mercatorProjection(project) {
	var m = projection(project), center = m.center, scale = m.scale, translate = m.translate, clipExtent = m.clipExtent, x0 = null, y0, x1, y1;
	m.scale = function(_) {
		return arguments.length ? (scale(_), reclip()) : scale();
	};
	m.translate = function(_) {
		return arguments.length ? (translate(_), reclip()) : translate();
	};
	m.center = function(_) {
		return arguments.length ? (center(_), reclip()) : center();
	};
	m.clipExtent = function(_) {
		return arguments.length ? (_ == null ? x0 = y0 = x1 = y1 = null : (x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]), reclip()) : x0 == null ? null : [[x0, y0], [x1, y1]];
	};
	function reclip() {
		var k = pi * scale(), t = m(rotation_default(m.rotate()).invert([0, 0]));
		return clipExtent(x0 == null ? [[t[0] - k, t[1] - k], [t[0] + k, t[1] + k]] : project === mercatorRaw ? [[Math.max(t[0] - k, x0), y0], [Math.min(t[0] + k, x1), y1]] : [[x0, Math.max(t[1] - k, y0)], [x1, Math.min(t[1] + k, y1)]]);
	}
	return reclip();
}
//#endregion
//#region src/data/inscoRegionalMapData.ts
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
/** Coordinates of INSCO's Giza Central PWHT Fleet Works (Abu El-Nomros, Giza 12911) */
var GIZA_DEPOT_COORDINATES = [31.205, 29.905];
var REGIONAL_VIEWPORT_PRESETS = [
	{
		id: "egypt_grid",
		label: {
			ar: "الشبكة القومية (مصر)",
			en: "Egypt National Grid"
		},
		center: [31.15, 29.75],
		scale: 4300,
		graticuleStep: [1, 1]
	},
	{
		id: "delta_canal",
		label: {
			ar: "الدلتا وقناة السويس",
			en: "Nile Delta & Suez"
		},
		center: [31.2, 30.65],
		scale: 8200,
		graticuleStep: [1, 1]
	},
	{
		id: "cairo_hub",
		label: {
			ar: "مركز القاهرة والجيزة",
			en: "Greater Cairo Hub"
		},
		center: [31.28, 30.02],
		scale: 18500,
		graticuleStep: [.5, .5]
	},
	{
		id: "all_footprint",
		label: {
			ar: "الانتشار الإقليمي والدولي",
			en: "Regional & International"
		},
		center: [48.5, 25.8],
		scale: 860,
		graticuleStep: [5, 5]
	}
];
var INSCO_REGIONAL_SITES = [
	{
		id: "giza-fleet-depot",
		code: "HUB-GZ",
		name: {
			ar: "مجمع الورش ومخازن أسطول PWHT المركزي — أبو النمرس",
			en: "Central PWHT Fleet Depot & Calibration Works — Giza"
		},
		shortName: {
			ar: "مخازن الأسطول (الجيزة)",
			en: "Giza 16-Unit Depot"
		},
		location: {
			ar: "شارع الجلاء، أبو النمرس، الجيزة 12911",
			en: "Abu El-Nomros, Giza 12911, Egypt"
		},
		countryCode: "EG",
		coordinates: GIZA_DEPOT_COORDINATES,
		category: "fleet_hub",
		client: "INSCO 100% Owned Asset Base",
		pwhtUnitsAllocated: 2,
		pwhtRoleLabel: {
			ar: "المقر اللوجستي لـ 16 وحدة 65 kW (وحدتان احتياط طوارئ 24/7)",
			en: "Home base of all 16 × 65 kW units (2 rapid-dispatch standby units)"
		},
		serialAllocation: "INS-PWHT-01 – INS-PWHT-16 (Standby: 15–16)",
		ndtMethods: [
			"UT",
			"PAUT",
			"RT",
			"MT",
			"PT",
			"PMI",
			"HT",
			"HYDRO"
		],
		governingCodes: [
			"ISO 9001:2015",
			"NIS Traceable Calibration",
			"ENRRA LS.0112"
		],
		status: "hub_24_7",
		dispatchWindow: {
			ar: "جاهزية تحرك فورية 24/7",
			en: "Immediate 24/7 Dispatch Base"
		},
		evidenceRef: "CR 209632 · Annex C-01 & D-02",
		scopeSummary: {
			ar: "مركز التخزين والمعايرة والصيانة الدورية لكامل أسطول إنسكو المملوك (16 ماكينة 65 kW أوتوماتيكية، مبرمجات 6 قنوات، وسخانات سيراميكية مرنة) لضمان التحرك الفوري لأي موقع دون انتظار سوق الإيجار.",
			en: "Primary staging, NIS calibration, and maintenance hub housing INSCO’s 16 company-owned 65 kW automatic PWHT units, 6-channel strip chart programmers, and flexible ceramic heating pads."
		}
	},
	{
		id: "cairo-hq",
		code: "HQ-CAI",
		name: {
			ar: "المقر الرئيسي وإدارة توكيد الجودة — المعادي",
			en: "Corporate Headquarters & QA/QC Command — Maadi, Cairo"
		},
		shortName: {
			ar: "المقر الرئيسي (المعادي)",
			en: "Cairo HQ (Maadi)"
		},
		location: {
			ar: "مشروع اللاسلكي، الأوتوستراد، المعادي، القاهرة",
			en: "Autostrade Way, Maadi, Cairo, Egypt"
		},
		countryCode: "EG",
		coordinates: [31.278, 29.968],
		category: "fleet_hub",
		client: "INSCO Corporate & CQI-IRCA Audit Office",
		pwhtUnitsAllocated: 0,
		pwhtRoleLabel: {
			ar: "غرفة عمليات الجدولة واعتماد مخططات PWHT و ITP",
			en: "Central PWHT thermal chart review, ITP & QA/QC command"
		},
		ndtMethods: [
			"VT",
			"UT",
			"PAUT",
			"RT",
			"PMI",
			"HT"
		],
		governingCodes: [
			"ISO 9001 / 14001 / 45001",
			"CQI-IRCA Cert #121",
			"ASME Sec. V"
		],
		status: "hub_24_7",
		dispatchWindow: {
			ar: "إدارة هندسية مركزية",
			en: "Central Engineering Control"
		},
		evidenceRef: "Annex A-01 to A-04 · EGAC CAB #120007",
		scopeSummary: {
			ar: "الإدارة الهندسية العليا ومكتب كبير مدققي الجودة CQI-IRCA لإصدار خطط الفحص والاختبار ITP، مراجعة مخططات المعالجة الحرارية Strip Charts، وإدارة التراخيص الإشعاعية ENRRA.",
			en: "Executive engineering office led by in-house CQI-IRCA Lead Auditor overseeing ITP approvals, ASME/AWS thermal chart sign-off, and ENRRA radiation safety compliance."
		}
	},
	{
		id: "burullus-ccpp",
		code: "EG-BRL",
		name: {
			ar: "محطة كهرباء البرلس ذات الدورة المركبة 4800 MW",
			en: "El-Burullus 4,800 MW Mega Combined-Cycle Power Plant"
		},
		shortName: {
			ar: "محطة البرلس 4800 MW",
			en: "Burullus 4,800 MW CCPP"
		},
		location: {
			ar: "البرلس، كفر الشيخ — الساحل الشمالي",
			en: "Burullus, Kafr El-Sheikh, Egypt"
		},
		countryCode: "EG",
		coordinates: [30.968, 31.582],
		category: "power",
		client: "ORASCOM Construction / SIEMENS AG",
		pwhtUnitsAllocated: 4,
		pwhtRoleLabel: {
			ar: "تشغيل 4 وحدات 65 kW أوتوماتيكية (قدرة 260 kVA)",
			en: "4 × 65 kW Automatic PWHT Units Allocated (260 kVA)"
		},
		serialAllocation: "INS-PWHT-01 – INS-PWHT-04",
		ndtMethods: [
			"PAUT",
			"RT",
			"UT",
			"MT",
			"PT",
			"HT"
		],
		governingCodes: [
			"ASME B31.1",
			"ASME Sec. V Art. 4",
			"AWS D10.10"
		],
		status: "active_reference",
		dispatchWindow: {
			ar: "زمن استنفار: 3.5 ساعات من الجيزة",
			en: "3.5 hr road dispatch from Giza"
		},
		evidenceRef: "Annex E-06 (Orascom) & Annex E-12 (Siemens)",
		scopeSummary: {
			ar: "أعمال التسخين المبدئي والمعالجة الحرارية PWHT لخطوط البخار عالي الضغط P91/P22 والفحص بالمصفوفات الطورية PAUT والتصوير الإشعاعي للخزانات والغلايات.",
			en: "High-pressure alloy steam piping (P91/P22) pre-heating and PWHT cycles alongside encoded Phased Array UT, X-ray RT, MT, and PT under Siemens/Orascom QA."
		}
	},
	{
		id: "ayoun-mousa-suez",
		code: "EG-AYM",
		name: {
			ar: "محطة توليد كهرباء عيون موسى البخارية — السويس",
			en: "Ayoun Mousa Steam Power Station — Gulf of Suez"
		},
		shortName: {
			ar: "محطة عيون موسى (السويس)",
			en: "Ayoun Mousa Plant (Suez)"
		},
		location: {
			ar: "عيون موسى، السويس / جنوب سيناء",
			en: "Ayoun Mousa, Suez, Egypt"
		},
		countryCode: "EG",
		coordinates: [32.652, 29.872],
		category: "power",
		client: "MARIDIVE Offshore & AIC / SIEMENS",
		pwhtUnitsAllocated: 2,
		pwhtRoleLabel: {
			ar: "تشغيل وحدتين 65 kW للمراجل وخطوط البخار",
			en: "2 × 65 kW Automatic PWHT Units Allocated (130 kVA)"
		},
		serialAllocation: "INS-PWHT-05 – INS-PWHT-06",
		ndtMethods: [
			"UT",
			"RT",
			"MT",
			"PT",
			"HT"
		],
		governingCodes: [
			"ASME Sec. I & VIII",
			"ASME B31.3",
			"ASTM A956"
		],
		status: "active_reference",
		dispatchWindow: {
			ar: "زمن استنفار: 2.5 ساعة عبر محور السويس",
			en: "2.5 hr dispatch via Suez corridor"
		},
		evidenceRef: "Verified Facility Track Record",
		scopeSummary: {
			ar: "معالجات حرارية بعد اللحام PWHT وفحوصات غير إتلافية بحرية وبرية لمراجل التوليد وأنابيب البخار عالية الضغط بالمدخل الشمالي لخليج السويس.",
			en: "Onshore and marine NDT inspections alongside automated 6-channel PWHT stress relieving on high-pressure boiler headers and steam lines."
		}
	},
	{
		id: "talkha-power",
		code: "EG-TLK",
		name: {
			ar: "محطة توليد كهرباء طلخا المركبة — الدقهلية",
			en: "Talkha Combined-Cycle Power Station — Dakahlia"
		},
		shortName: {
			ar: "محطة كهرباء طلخا",
			en: "Talkha Power Station"
		},
		location: {
			ar: "طلخا / المنصورة، محافظة الدقهلية",
			en: "Talkha, Dakahlia, Nile Delta, Egypt"
		},
		countryCode: "EG",
		coordinates: [31.378, 31.054],
		category: "power",
		client: "CMI Energy & ARESCO",
		pwhtUnitsAllocated: 2,
		pwhtRoleLabel: {
			ar: "تشغيل وحدتين 65 kW لغلايات استرجاع الحرارة HRSG",
			en: "2 × 65 kW Automatic PWHT Units Allocated (130 kVA)"
		},
		serialAllocation: "INS-PWHT-07 – INS-PWHT-08",
		ndtMethods: [
			"UT",
			"RT",
			"MT",
			"PT",
			"PMI",
			"HT"
		],
		governingCodes: [
			"ASME Sec. I",
			"ASME B31.1",
			"AWS D10.10"
		],
		status: "active_reference",
		dispatchWindow: {
			ar: "زمن استنفار: 2.5 ساعة لوسط الدلتا",
			en: "2.5 hr dispatch to Central Delta"
		},
		evidenceRef: "Brochure Facility & Fleet Record",
		scopeSummary: {
			ar: "تنفيذ دورات المعالجة الحرارية المبرمجة وفحص سبائك PMI والصلادة والموجات فوق الصوتية لوصلات غلايات استرجاع الطاقة HRSG والتوربينات.",
			en: "Programmed thermal stress-relieving cycles, alloy verification (PMI), UCI hardness testing, and volumetric UT/RT on HRSG boiler modules and turbine piping."
		}
	},
	{
		id: "kureimat-power",
		code: "EG-KRM",
		name: {
			ar: "محطة توليد كهرباء الكريمات — بني سويف",
			en: "El-Kureimat Thermal & Solar-Combined Power Plant"
		},
		shortName: {
			ar: "محطة الكريمات (بني سويف)",
			en: "El-Kureimat Plant"
		},
		location: {
			ar: "الكريمات، شمال بني سويف / جنوب الجيزة",
			en: "El-Kureimat, Beni Suef Corridor, Egypt"
		},
		countryCode: "EG",
		coordinates: [31.245, 29.278],
		category: "power",
		client: "CMI Energy & ARESCO",
		pwhtUnitsAllocated: 2,
		pwhtRoleLabel: {
			ar: "تشغيل وحدتين 65 kW لخطوط التوربينات البخارية",
			en: "2 × 65 kW Automatic PWHT Units Allocated (130 kVA)"
		},
		serialAllocation: "INS-PWHT-09 – INS-PWHT-10",
		ndtMethods: [
			"UT",
			"RT",
			"MT",
			"PT",
			"HT"
		],
		governingCodes: [
			"ASME B31.1",
			"ASME Sec. V",
			"ISO 17636"
		],
		status: "active_reference",
		dispatchWindow: {
			ar: "زمن استنفار: 1.5 ساعة عبر الأوتوستراد",
			en: "1.5 hr dispatch via Upper Nile Hwy"
		},
		evidenceRef: "Brochure Facility Record",
		scopeSummary: {
			ar: "معالجة حرارية موضعية PWHT وفحوصات إشعاعية وفوق صوتية لوصلات اللحام الحرجة بمحطة الكريمات على ممر الصعيد الصناعي.",
			en: "Localized ceramic-pad PWHT soaking cycles and volumetric RT/UT weld verification across high-temperature power generation circuits."
		}
	},
	{
		id: "elsewedy-cairo",
		code: "EG-SWD",
		name: {
			ar: "مصانع السويدي إلكتريك للمحولات العملاقة — العاشر / القاهرة",
			en: "Elsewedy Electric High-Voltage Transformer Works"
		},
		shortName: {
			ar: "مصانع السويدي للمحولات",
			en: "Elsewedy Transformer Works"
		},
		location: {
			ar: "العاشر من رمضان / شرق القاهرة",
			en: "10th of Ramadan / East Cairo, Egypt"
		},
		countryCode: "EG",
		coordinates: [31.742, 30.298],
		category: "industrial",
		client: "El Sewedy Electric (PO GM102473)",
		pwhtUnitsAllocated: 2,
		pwhtRoleLabel: {
			ar: "تشغيل وحدتين 65 kW لإزالة إجهادات خزانات المحولات",
			en: "2 × 65 kW Automatic PWHT Units Allocated (130 kVA)"
		},
		serialAllocation: "INS-PWHT-11 – INS-PWHT-12",
		ndtMethods: [
			"VT",
			"UT",
			"MT",
			"PT",
			"RT",
			"HT",
			"PC"
		],
		governingCodes: [
			"AWS D1.1",
			"ASME Sec. VIII Div. 1",
			"ASTM A956"
		],
		status: "active_reference",
		dispatchWindow: {
			ar: "زمن استنفار: 1.5 ساعة من الجيزة",
			en: "1.5 hr dispatch from Giza Works"
		},
		evidenceRef: "Annex E-01 · Signed PO GM102473",
		scopeSummary: {
			ar: "حزمة متكاملة من فحوصات VT, UT, MT, PT, RT واختبارات الصلادة بعد المعالجة الحرارية PWHT لهياكل وخزانات محولات القدرة العملاقة.",
			en: "Full-scope VT, UT, MT, PT, RT, Leeb/UCI hardness testing, and PWHT stress relief on heavy structural power transformer tanks."
		}
	},
	{
		id: "october-power",
		code: "EG-OCT",
		name: {
			ar: "محطة توليد كهرباء 6 أكتوبر — غرب القاهرة",
			en: "6th of October Gas/Combined Power Station"
		},
		shortName: {
			ar: "محطة كهرباء 6 أكتوبر",
			en: "6th of October Power Plant"
		},
		location: {
			ar: "المنطقة الصناعية، مدينة 6 أكتوبر، الجيزة",
			en: "6th of October City, West Cairo, Egypt"
		},
		countryCode: "EG",
		coordinates: [30.895, 29.932],
		category: "power",
		client: "PGESCO / GE — Orascom",
		pwhtUnitsAllocated: 1,
		pwhtRoleLabel: {
			ar: "تخصيص وحدة 65 kW لخطوط الغاز وأوعية الضغط",
			en: "1 × 65 kW Automatic PWHT Unit Allocated (65 kVA)"
		},
		serialAllocation: "INS-PWHT-13",
		ndtMethods: [
			"RT",
			"UT",
			"MT",
			"PT",
			"HYDRO",
			"MFL / EC"
		],
		governingCodes: [
			"ASME B31.3",
			"API 650",
			"API 1104"
		],
		status: "active_reference",
		dispatchWindow: {
			ar: "زمن استنفار: 45 دقيقة من أبو النمرس",
			en: "45 min rapid dispatch from Giza"
		},
		evidenceRef: "PGESCO / GE Client Track Record",
		scopeSummary: {
			ar: "تنفيذ كافة فحوصات NDT على خطوط إمداد الوقود والغاز وخزانات الوقود وأوعية الضغط مع المعالجة الحرارية الموضعية.",
			en: "Comprehensive pipeline, fuel storage tank, and pressure vessel NDT inspection alongside rapid-response localized PWHT."
		}
	},
	{
		id: "borg-el-arab",
		code: "EG-BEA",
		name: {
			ar: "مجمع مصانع الزيوت النباتية NVOC — برج العرب",
			en: "NVOC Industrial Process Complex — Borg El-Arab"
		},
		shortName: {
			ar: "مجمع برج العرب (الإسكندرية)",
			en: "Borg El-Arab Plant (Alex)"
		},
		location: {
			ar: "برج العرب الصناعية، الإسكندرية",
			en: "Borg El-Arab, Alexandria, Egypt"
		},
		countryCode: "EG",
		coordinates: [29.578, 30.884],
		category: "industrial",
		client: "PSEW / National Vegetable Oils Co. (NVOC)",
		pwhtUnitsAllocated: 1,
		pwhtRoleLabel: {
			ar: "تخصيص وحدة 65 kW للأوعية الصناعية والمبادلات",
			en: "1 × 65 kW Automatic PWHT Unit Allocated (65 kVA)"
		},
		serialAllocation: "INS-PWHT-14",
		ndtMethods: [
			"RT",
			"UT",
			"PT",
			"MT",
			"PAUT",
			"SR"
		],
		governingCodes: [
			"ASME Sec. VIII",
			"ASME B31.3",
			"ISO 8503"
		],
		status: "active_reference",
		dispatchWindow: {
			ar: "زمن استنفار: 2.5 ساعة عبر صحراوي الإسكندرية",
			en: "2.5 hr dispatch via Desert Road"
		},
		evidenceRef: "Brochure Industrial Client Record",
		scopeSummary: {
			ar: "فحوصات RT, UT, PT, MT والمعالجة الحرارية بعد اللحام PWHT لأوعية التصنيع وخطوط البخار والمبادلات الحرارية ببرج العرب.",
			en: "Process vessel and piping integrity package combining RT, UT, PAUT, PT, MT, and automated 65 kW PWHT thermal cycles."
		}
	},
	{
		id: "masila-yemen",
		code: "INT-YEM",
		name: {
			ar: "خطوط أنابيب بترول قطاع المسيلة — حضرموت، اليمن",
			en: "Masila Block Cross-Country Oil Pipelines — R.O. Yemen"
		},
		shortName: {
			ar: "قطاع المسيلة البترولي (اليمن)",
			en: "Masila Oil Block (Yemen)"
		},
		location: {
			ar: "حوض المسيلة، حضرموت، الجمهورية اليمنية",
			en: "Masila Basin, Hadramout, Yemen"
		},
		countryCode: "YE",
		coordinates: [49.15, 15.55],
		category: "oil_gas",
		client: "ADPC / PETROMASILA & ASPC",
		pwhtUnitsAllocated: 0,
		pwhtRoleLabel: {
			ar: "بعثة فحص إشعاعي جاما وعوازل خطوط أنابيب بترولية",
			en: "Expeditionary Gamma RT & Pipeline Holiday Testing Crew"
		},
		ndtMethods: [
			"RT",
			"PC",
			"VT",
			"UT"
		],
		governingCodes: [
			"API 1104",
			"NACE SP0188",
			"ASME Sec. V Art. 2"
		],
		status: "international_completed",
		dispatchWindow: {
			ar: "تعبئة دولية عبر الشحن الجوي/البحري",
			en: "Cross-border air/sea mobilization"
		},
		evidenceRef: "PetroMasila Regional Track Record",
		scopeSummary: {
			ar: "حملات فحص إشعاعي بمصادر جاما (Ir-192) واختبار عوازل الطلاء بالشرر عالي الجهد Holiday لخطوط نقل النفط الخام بقطاع المسيلة.",
			en: "Cross-border oilfield pipeline radiography (Gamma-Ray Ir-192) and high-voltage holiday coating continuity inspection for PetroMasila."
		}
	},
	{
		id: "bagram-afghanistan",
		code: "INT-AFG",
		name: {
			ar: "منشآت وقود الطائرات بقاعدة باجرام — أفغانستان",
			en: "Bagram Airfield Fuel Tanker Offload Facility — Afghanistan"
		},
		shortName: {
			ar: "منشآت وقود باجرام (أفغانستان)",
			en: "Bagram Fuel Facility (AFG)"
		},
		location: {
			ar: "مطار باجرام، ولاية بروان، أفغانستان",
			en: "Bagram Air Base, Parwan, Afghanistan"
		},
		countryCode: "AF",
		coordinates: [69.265, 34.946],
		category: "oil_gas",
		client: "U.S. Army Corps of Engineers / Serka & Contrack",
		pwhtUnitsAllocated: 2,
		pwhtRoleLabel: {
			ar: "تعبئة دولية لوحدتي PWHT (مهمة مكتملة موثقة)",
			en: "2 × 65 kW PWHT Expeditionary Deployment (Completed Mission)"
		},
		ndtMethods: [
			"RT",
			"UT",
			"MT",
			"PT",
			"HYDRO"
		],
		governingCodes: [
			"ASME B31.3",
			"API 650",
			"USACE QA Standards"
		],
		status: "international_completed",
		dispatchWindow: {
			ar: "شحن جوي استراتيجي لمعدات PWHT و NDT",
			en: "Chartered airlift mobilization"
		},
		evidenceRef: "Annex B-01 · Serka Group Appreciation Letter",
		scopeSummary: {
			ar: "تنفيذ أعمال التفتيش غير الإتلافي والمعالجة الحرارية PWHT لمنشآت تفريغ وتخزين وقود الطائرات بمشروع سلاح المهندسين الأمريكي.",
			en: "International mobilization delivering full NDT and PWHT stress-relieving works on aviation fuel offload piping and tanks under USACE QA."
		}
	}
];
/**
* Ensures every GeoJSON Polygon ring complies with d3-geo's spherical clockwise
* winding convention so interiors never invert across the globe.
*/
function makeCountryFeature(id, nameEn, nameAr, role, ring) {
	const closedRing = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1] ? ring : [...ring, ring[0]];
	const candidate = {
		type: "Feature",
		properties: {
			id,
			nameEn,
			nameAr,
			role
		},
		geometry: {
			type: "Polygon",
			coordinates: [closedRing]
		}
	};
	if (area_default(candidate) > Math.PI) candidate.geometry.coordinates = [[...closedRing].reverse()];
	return candidate;
}
var REGIONAL_LANDMASS_COLLECTION = {
	type: "FeatureCollection",
	features: [
		makeCountryFeature("EG", "Egypt", "مصر", "core", [
			[25.15, 31.58],
			[27.22, 31.36],
			[28.95, 30.86],
			[29.88, 31.21],
			[30.42, 31.46],
			[30.98, 31.59],
			[31.82, 31.52],
			[32.31, 31.27],
			[33.15, 31.12],
			[34.26, 31.29],
			[34.89, 29.5],
			[34.43, 27.98],
			[34.18, 27.73],
			[33.58, 28.22],
			[32.95, 29.22],
			[32.56, 29.96],
			[32.36, 29.82],
			[32.62, 29.02],
			[33.82, 27.24],
			[34.78, 25.45],
			[35.48, 23.95],
			[35.85, 22],
			[25, 22],
			[25, 29.2],
			[25.15, 31.58]
		]),
		makeCountryFeature("LY", "Libya", "ليبيا", "context", [
			[19.5, 30.3],
			[20.1, 32.1],
			[22.9, 32.8],
			[25.15, 31.58],
			[25, 29.2],
			[25, 22],
			[19.5, 22],
			[19.5, 30.3]
		]),
		makeCountryFeature("SD", "Sudan", "السودان", "context", [
			[25, 22],
			[35.85, 22],
			[37.25, 20.8],
			[38.55, 18.05],
			[36.5, 14.5],
			[25, 14.5],
			[25, 22]
		]),
		makeCountryFeature("SA", "Saudi Arabia", "السعودية", "context", [
			[34.95, 29.35],
			[36.9, 29.8],
			[39.2, 32.1],
			[42.1, 31.2],
			[46.5, 29.1],
			[48.5, 28.5],
			[50.15, 26.25],
			[51.55, 24.15],
			[55.15, 22.65],
			[52, 19],
			[47.2, 17.05],
			[43.2, 17.45],
			[42.65, 16.45],
			[41.4, 18.8],
			[39.1, 21.55],
			[38.05, 24.05],
			[36.5, 26.2],
			[34.95, 29.35]
		]),
		makeCountryFeature("YE", "Yemen", "اليمن", "international", [
			[42.65, 16.45],
			[43.2, 17.45],
			[47.2, 17.05],
			[52, 19],
			[53.1, 16.65],
			[51.1, 15.15],
			[48.2, 14],
			[45.1, 12.75],
			[43.45, 12.65],
			[42.9, 14.8],
			[42.65, 16.45]
		]),
		makeCountryFeature("OM", "Oman", "عُمان", "context", [
			[52, 19],
			[55.15, 22.65],
			[56.35, 25.95],
			[59.8, 22.55],
			[57.75, 19.8],
			[55.2, 17.05],
			[53.1, 16.65],
			[52, 19]
		]),
		makeCountryFeature("AE", "UAE", "الإمارات", "context", [
			[51.55, 24.15],
			[54.4, 24.5],
			[56.1, 25.95],
			[56.35, 25.1],
			[55.15, 22.65],
			[51.55, 24.15]
		]),
		makeCountryFeature("JO", "Levant", "المشرق", "context", [
			[34.26, 31.29],
			[35.1, 33.1],
			[35.9, 35.8],
			[41.2, 37],
			[42.1, 34.5],
			[39.2, 32.1],
			[36.9, 29.8],
			[34.95, 29.35],
			[34.89, 29.5],
			[34.26, 31.29]
		]),
		makeCountryFeature("IQ", "Iraq", "العراق", "context", [
			[39.2, 32.1],
			[42.1, 34.5],
			[42.5, 37.1],
			[45.4, 35.9],
			[48.4, 30],
			[46.5, 29.1],
			[42.1, 31.2],
			[39.2, 32.1]
		]),
		makeCountryFeature("IR", "Iran", "إيران", "context", [
			[45.4, 35.9],
			[48.8, 38.4],
			[54, 37.5],
			[61.2, 35.6],
			[61.6, 31.2],
			[63.2, 27.2],
			[61.5, 25.2],
			[56.6, 27.1],
			[53.2, 26.8],
			[50.5, 28.9],
			[48.4, 30],
			[45.4, 35.9]
		]),
		makeCountryFeature("AF", "Afghanistan", "أفغانستان", "international", [
			[61.2, 35.6],
			[65.2, 37.3],
			[68.8, 37.2],
			[71.5, 37.9],
			[74.5, 37.2],
			[71.2, 34.2],
			[69.4, 31.6],
			[66.2, 29.9],
			[61.6, 29.8],
			[61.6, 31.2],
			[61.2, 35.6]
		]),
		makeCountryFeature("PK", "Pakistan", "باكستان", "context", [
			[61.5, 25.2],
			[63.2, 27.2],
			[61.6, 29.8],
			[66.2, 29.9],
			[69.4, 31.6],
			[71.2, 34.2],
			[74.2, 32.5],
			[71.1, 27.8],
			[67.1, 24.8],
			[61.5, 25.2]
		])
	]
};
var REGIONAL_HYDRO_COLLECTION = {
	type: "FeatureCollection",
	features: [
		{
			type: "Feature",
			properties: { name: "Nile River" },
			geometry: {
				type: "LineString",
				coordinates: [
					[31.3, 22],
					[32.89, 24.09],
					[32.64, 25.69],
					[32.72, 26.16],
					[31.18, 27.18],
					[30.85, 28.1],
					[31.1, 29.07],
					[31.22, 29.55],
					[31.24, 30.05],
					[31.14, 30.18]
				]
			}
		},
		{
			type: "Feature",
			properties: { name: "Rosetta Branch" },
			geometry: {
				type: "LineString",
				coordinates: [
					[31.14, 30.18],
					[30.82, 30.65],
					[30.48, 31.15],
					[30.38, 31.46]
				]
			}
		},
		{
			type: "Feature",
			properties: { name: "Damietta Branch" },
			geometry: {
				type: "LineString",
				coordinates: [
					[31.14, 30.18],
					[31.26, 30.68],
					[31.38, 31.05],
					[31.81, 31.5]
				]
			}
		},
		{
			type: "Feature",
			properties: { name: "Suez Canal" },
			geometry: {
				type: "LineString",
				coordinates: [
					[32.56, 29.96],
					[32.35, 30.35],
					[32.31, 30.6],
					[32.31, 31.26]
				]
			}
		}
	]
};
var EARTH_RADIUS_KM = 6371;
function calculateMobilizationDistanceKm(targetCoords) {
	if (Math.abs(targetCoords[0] - GIZA_DEPOT_COORDINATES[0]) < 1e-4 && Math.abs(targetCoords[1] - GIZA_DEPOT_COORDINATES[1]) < 1e-4) return 0;
	const radians = distance_default(GIZA_DEPOT_COORDINATES, targetCoords);
	return Math.round(radians * EARTH_RADIUS_KM);
}
function getRegionalCategoryLabel(category, isAr) {
	switch (category) {
		case "fleet_hub": return isAr ? "المقر ومخازن الأسطول" : "HQ & Fleet Depot";
		case "power": return isAr ? "محطات توليد الطاقة" : "Power Generation";
		case "industrial": return isAr ? "المجمعات الصناعية" : "Heavy Industrial";
		case "oil_gas": return isAr ? "البترول والوقود الدولي" : "Oil, Gas & Fuel";
	}
}
//#endregion
//#region src/components/company/CompanyRegionalFleetMap.tsx
var import_jsx_runtime = require_jsx_runtime();
var SVG_WIDTH = 820;
var SVG_HEIGHT = 490;
var MIN_SCALE = 650;
var MAX_SCALE = 28e3;
function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}
/**
* Resolves marker overlaps deterministically so closely spaced industrial sites
* (e.g., Greater Cairo & Nile Delta at wide regional zoom) remain individually
* clickable while keeping a crisp leader line to their true geographic coordinate.
*/
function resolvePinCollisions(rawPins, minDist = 30) {
	const nodes = rawPins.map((p, idx) => {
		const angle = idx * 2.39996 % (Math.PI * 2);
		return {
			...p,
			displayX: p.anchorX + Math.cos(angle) * .5,
			displayY: p.anchorY + Math.sin(angle) * .5
		};
	});
	for (let iter = 0; iter < 18; iter++) {
		for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
			const a = nodes[i];
			const b = nodes[j];
			const dx = b.displayX - a.displayX;
			const dy = b.displayY - a.displayY;
			const dist = Math.hypot(dx, dy) || .01;
			if (dist < minDist) {
				const push = (minDist - dist) * .52;
				const ux = dx / dist;
				const uy = dy / dist;
				a.displayX -= ux * push;
				a.displayY -= uy * push;
				b.displayX += ux * push;
				b.displayY += uy * push;
			}
		}
		for (const node of nodes) {
			node.displayX += (node.anchorX - node.displayX) * .12;
			node.displayY += (node.anchorY - node.displayY) * .12;
			node.displayX = clamp(node.displayX, 28, 792);
			node.displayY = clamp(node.displayY, 28, 462);
		}
	}
	return nodes.map((n) => ({
		...n,
		displaced: Math.hypot(n.displayX - n.anchorX, n.displayY - n.anchorY) > 6
	}));
}
var CompanyRegionalFleetMap = ({ language, onSelectNdtMethod, onNavigateToAcademyModule }) => {
	const isAr = language === "ar";
	const { isLight } = useTheme();
	const defaultPreset = REGIONAL_VIEWPORT_PRESETS.find((p) => p.id === "all_footprint") ?? REGIONAL_VIEWPORT_PRESETS[0];
	const [activePresetId, setActivePresetId] = (0, import_react.useState)(defaultPreset.id);
	const [center, setCenter] = (0, import_react.useState)(defaultPreset.center);
	const [scale, setScale] = (0, import_react.useState)(defaultPreset.scale);
	const [activeFilter, setActiveFilter] = (0, import_react.useState)("all");
	const [selectedSiteId, setSelectedSiteId] = (0, import_react.useState)("burullus-ccpp");
	const [hoveredSiteId, setHoveredSiteId] = (0, import_react.useState)(null);
	const [showMobilizationArcs, setShowMobilizationArcs] = (0, import_react.useState)(true);
	const dragStateRef = (0, import_react.useRef)({
		dragging: false,
		startX: 0,
		startY: 0,
		startCenter: defaultPreset.center
	});
	const filterOptions = [
		{
			id: "all",
			label: {
				ar: `كافة المواقع (${INSCO_REGIONAL_SITES.length})`,
				en: `All Sites (${INSCO_REGIONAL_SITES.length})`
			}
		},
		{
			id: "pwht_active",
			label: {
				ar: "مواقع وحدات PWHT",
				en: "PWHT Fleet Sites"
			}
		},
		{
			id: "power",
			label: {
				ar: "محطات الطاقة",
				en: "Power Stations"
			}
		},
		{
			id: "industrial",
			label: {
				ar: "المجمعات الصناعية",
				en: "Industrial Plants"
			}
		},
		{
			id: "oil_gas",
			label: {
				ar: "البترول والمشروعات الدولية",
				en: "Oil, Gas & International"
			}
		},
		{
			id: "fleet_hub",
			label: {
				ar: "المقر ومخازن الأسطول",
				en: "HQ & Depot"
			}
		}
	];
	const filteredSites = (0, import_react.useMemo)(() => {
		return INSCO_REGIONAL_SITES.filter((site) => {
			if (activeFilter === "all") return true;
			if (activeFilter === "pwht_active") return site.pwhtUnitsAllocated > 0;
			return site.category === activeFilter;
		});
	}, [activeFilter]);
	const selectedSite = (0, import_react.useMemo)(() => {
		return filteredSites.find((s) => s.id === selectedSiteId) ?? INSCO_REGIONAL_SITES.find((s) => s.id === selectedSiteId) ?? filteredSites[0] ?? INSCO_REGIONAL_SITES[0];
	}, [filteredSites, selectedSiteId]);
	const handleApplyFilter = (nextFilter) => {
		setActiveFilter(nextFilter);
		const matching = INSCO_REGIONAL_SITES.filter((site) => {
			if (nextFilter === "all") return true;
			if (nextFilter === "pwht_active") return site.pwhtUnitsAllocated > 0;
			return site.category === nextFilter;
		});
		if (matching.length > 0 && !matching.some((s) => s.id === selectedSiteId)) setSelectedSiteId(matching[0].id);
		if (nextFilter === "oil_gas") {
			const intlPreset = REGIONAL_VIEWPORT_PRESETS.find((p) => p.id === "all_footprint");
			if (intlPreset) {
				setActivePresetId("all_footprint");
				setCenter(intlPreset.center);
				setScale(intlPreset.scale);
			}
		}
	};
	const handleSelectPreset = (presetId) => {
		const preset = REGIONAL_VIEWPORT_PRESETS.find((p) => p.id === presetId);
		if (!preset) return;
		setActivePresetId(preset.id);
		setCenter(preset.center);
		setScale(preset.scale);
	};
	const handleZoom = (factor) => {
		setScale((prev) => clamp(Math.round(prev * factor), MIN_SCALE, MAX_SCALE));
	};
	const handleFocusSite = (site) => {
		setSelectedSiteId(site.id);
		setCenter(site.coordinates);
		const targetScale = site.countryCode === "EG" ? 7500 : 2200;
		setScale(targetScale);
	};
	const handleSelectSiteFromDirectory = (site) => {
		setSelectedSiteId(site.id);
		if (site.countryCode !== "EG" && scale > 1800) {
			const overview = REGIONAL_VIEWPORT_PRESETS.find((p) => p.id === "all_footprint");
			if (overview) {
				setActivePresetId("all_footprint");
				setCenter(overview.center);
				setScale(overview.scale);
			}
		}
	};
	const { countryPaths, hydroPaths, graticulePath, depotPoint, projectedPins } = (0, import_react.useMemo)(() => {
		const proj = mercator_default().center(center).scale(scale).translate([SVG_WIDTH / 2, SVG_HEIGHT / 2]);
		const pathGen = path_default(proj);
		const stepDeg = scale >= 12e3 ? [.5, .5] : scale >= 3200 ? [2, 2] : [5, 5];
		const gratSvg = pathGen(graticule().step(stepDeg)()) || "";
		return {
			countryPaths: REGIONAL_LANDMASS_COLLECTION.features.map((feat) => {
				const centroid = pathGen.centroid(feat);
				return {
					id: feat.properties.id,
					nameEn: feat.properties.nameEn,
					nameAr: feat.properties.nameAr,
					role: feat.properties.role,
					d: pathGen(feat) || "",
					centroid: Number.isFinite(centroid[0]) && Number.isFinite(centroid[1]) ? centroid : null
				};
			}),
			hydroPaths: REGIONAL_HYDRO_COLLECTION.features.map((feat, idx) => ({
				key: `${feat.properties.name}-${idx}`,
				d: pathGen(feat) || ""
			})),
			graticulePath: gratSvg,
			depotPoint: proj(GIZA_DEPOT_COORDINATES) ?? [SVG_WIDTH / 2, SVG_HEIGHT / 2],
			projectedPins: resolvePinCollisions(filteredSites.map((site) => {
				const pt = proj(site.coordinates);
				if (!pt || !Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) return null;
				return {
					site,
					anchorX: pt[0],
					anchorY: pt[1]
				};
			}).filter((item) => Boolean(item)).filter((p) => p.anchorX >= -40 && p.anchorX <= 860 && p.anchorY >= -40 && p.anchorY <= 530), scale >= 1e4 ? 24 : 30)
		};
	}, [
		center,
		scale,
		filteredSites
	]);
	const handlePointerDown = (e) => {
		if (e.target.closest("[data-map-pin=\"true\"]")) return;
		dragStateRef.current = {
			dragging: true,
			startX: e.clientX,
			startY: e.clientY,
			startCenter: center
		};
		e.currentTarget.setPointerCapture?.(e.pointerId);
	};
	const handlePointerMove = (e) => {
		if (!dragStateRef.current.dragging) return;
		const dx = e.clientX - dragStateRef.current.startX;
		const dy = e.clientY - dragStateRef.current.startY;
		const degPerPx = 180 / Math.PI / scale;
		const nextLng = clamp(dragStateRef.current.startCenter[0] - dx * degPerPx, 20, 75);
		const nextLat = clamp(dragStateRef.current.startCenter[1] + dy * degPerPx * .88, 10, 40);
		setCenter([nextLng, nextLat]);
	};
	const handlePointerUp = (e) => {
		if (!dragStateRef.current.dragging) return;
		dragStateRef.current.dragging = false;
		e.currentTarget.releasePointerCapture?.(e.pointerId);
	};
	const selectedDistanceKm = (0, import_react.useMemo)(() => calculateMobilizationDistanceKm(selectedSite.coordinates), [selectedSite]);
	const mapColors = isLight ? {
		seaBg: "#e8f1f8",
		graticule: "#cbd5e1",
		contextLandFill: "#f8fafc",
		contextLandStroke: "#94a3b8",
		intlLandFill: "#fef3c7",
		intlLandStroke: "#d97706",
		coreLandFill: "#ecfeff",
		coreLandStroke: "#0891b2",
		countryLabel: "#475569",
		coreLabel: "#0e7490",
		nileStroke: "#0284c7",
		arcActive: "#0891b2",
		arcMuted: "#64748b",
		leaderStroke: "#475569",
		pinPlate: "#ffffff",
		pinPlateSelected: "#0f172a",
		pinText: "#0f172a",
		pinTextSelected: "#ffffff"
	} : {
		seaBg: "#050b16",
		graticule: "#162238",
		contextLandFill: "#0d1526",
		contextLandStroke: "#283652",
		intlLandFill: "#1c1a17",
		intlLandStroke: "#b45309",
		coreLandFill: "#0c2136",
		coreLandStroke: "#06b6d4",
		countryLabel: "#64748b",
		coreLabel: "#22d3ee",
		nileStroke: "#38bdf8",
		arcActive: "#22d3ee",
		arcMuted: "#475569",
		leaderStroke: "#94a3b8",
		pinPlate: "#0f172a",
		pinPlateSelected: "#ecfeff",
		pinText: "#f1f5f9",
		pinTextSelected: "#020617"
	};
	const getPinAccent = (category) => {
		if (category === "fleet_hub") return isLight ? "#d97706" : "#f59e0b";
		if (category === "power") return isLight ? "#0891b2" : "#22d3ee";
		if (category === "industrial") return isLight ? "#059669" : "#10b981";
		return isLight ? "#e11d48" : "#fb7185";
	};
	const totalEgyptSites = INSCO_REGIONAL_SITES.filter((s) => s.countryCode === "EG").length;
	const totalIntlSites = INSCO_REGIONAL_SITES.length - totalEgyptSites;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		id: "services-regional-map",
		"data-testid": "company-regional-fleet-map",
		className: "mb-14 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 sm:p-7 space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-800 pb-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5 max-w-3xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2 text-xs font-mono text-cyan-400",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Compass, {
									className: "w-4 h-4 shrink-0",
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "التوزيع الجغرافي لأسطول PWHT ومواقع المشروعات" : "Geographic Distribution · PWHT Fleet & Project Sites" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									"aria-hidden": "true",
									className: "text-slate-600",
									children: "·"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-slate-400 tabular-nums",
									children: [
										16,
										" × ",
										65,
										" kW (",
										1040,
										" kVA)"
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xl sm:text-2xl font-black text-white tracking-tight text-balance",
							children: isAr ? "خريطة الانتشار الإقليمي لأسطول المعالجة الحرارية (16 وحدة) ومواقع التنفيذ" : "Interactive Regional Map of INSCO’s 16-Unit PWHT Fleet & Project Footprint"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs sm:text-sm text-slate-400 leading-relaxed",
							children: isAr ? "خريطة لبيانات الانتشار الواردة في ملف الشركة. التوزيع والأزمنة أمثلة مرجعية؛ ليست تتبعًا مباشرًا أو تأكيدًا للجاهزية." : "Company profile deployment map. Allocations and times are reference examples, not live tracking or a readiness commitment."
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-mono tabular-nums text-slate-300 shrink-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-lg font-black text-cyan-400",
							children: 16
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] text-slate-400 font-sans",
							children: isAr ? "وحدة 65 kW مملوكة" : "Owned 65 kW Units"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": "true",
							className: "text-slate-700",
							children: "/"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-lg font-black text-white",
							children: totalEgyptSites
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] text-slate-400 font-sans",
							children: isAr ? "مراكز ومواقع بمصر" : "Egypt Hubs & Sites"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": "true",
							className: "text-slate-700",
							children: "/"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-lg font-black text-amber-400",
							children: totalIntlSites
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] text-slate-400 font-sans",
							children: isAr ? "بعثات دولية موثقة" : "Intl. Deployments"
						})] })
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col xl:flex-row xl:items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					role: "group",
					"aria-label": isAr ? "تصفية مواقع الخريطة حسب القطاع" : "Filter map sites by sector",
					className: "flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800",
					children: filterOptions.map((opt) => {
						const active = activeFilter === opt.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => handleApplyFilter(opt.id),
							"aria-pressed": active,
							className: `px-2.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap ${active ? "bg-cyan-600 text-white shadow-2xs" : "text-slate-400 hover:text-white hover:bg-slate-900"}`,
							children: opt.label[language]
						}, opt.id);
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					role: "group",
					"aria-label": isAr ? "نطاق عرض الخريطة الجغرافي" : "Geographic map camera presets",
					className: "flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800",
					children: REGIONAL_VIEWPORT_PRESETS.map((preset) => {
						const active = activePresetId === preset.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => handleSelectPreset(preset.id),
							"aria-pressed": active,
							className: `px-2.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap ${active ? "bg-slate-800 text-cyan-300 border border-cyan-500/40" : "text-slate-400 hover:text-slate-200"}`,
							children: preset.label[language]
						}, preset.id);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "lg:col-span-7 space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 select-none",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "absolute top-3 left-3 right-3 z-10 flex items-center justify-between gap-2 pointer-events-none",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setShowMobilizationArcs((prev) => !prev),
									"aria-pressed": showMobilizationArcs,
									className: "pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/90 backdrop-blur-md border border-slate-700 text-[11px] font-medium text-slate-200 hover:border-cyan-500/50 transition cursor-pointer",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigation, {
										className: "w-3.5 h-3.5 text-cyan-400",
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "مسارات الاستنفار من الجيزة" : "Giza Mobilization Arcs" })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pointer-events-auto flex items-center gap-1 rounded-lg bg-slate-950/90 backdrop-blur-md border border-slate-700 p-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => handleZoom(1.45),
											"aria-label": isAr ? "تكبير الخريطة" : "Zoom in map",
											title: isAr ? "تكبير الخريطة" : "Zoom in map",
											className: "p-1.5 rounded text-slate-200 hover:bg-slate-800 transition cursor-pointer",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-3.5 h-3.5" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => handleZoom(1 / 1.45),
											"aria-label": isAr ? "تصغير الخريطة" : "Zoom out map",
											title: isAr ? "تصغير الخريطة" : "Zoom out map",
											className: "p-1.5 rounded text-slate-200 hover:bg-slate-800 transition cursor-pointer",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "w-3.5 h-3.5" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => handleSelectPreset(defaultPreset.id),
											"aria-label": isAr ? "إعادة ضبط عرض الخريطة" : "Reset map view",
											title: isAr ? "إعادة ضبط عرض الخريطة" : "Reset map view",
											className: "p-1.5 rounded text-slate-200 hover:bg-slate-800 transition cursor-pointer",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "w-3.5 h-3.5" })
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
								viewBox: `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`,
								role: "img",
								"aria-label": isAr ? "خريطة إقليمية تفاعلية لتوزيع أسطول المعالجة الحرارية ومواقع مشروعات إنسكو" : "Interactive regional map of INSCO PWHT fleet hubs and project sites",
								onPointerDown: handlePointerDown,
								onPointerMove: handlePointerMove,
								onPointerUp: handlePointerUp,
								onPointerCancel: handlePointerUp,
								className: "w-full h-[360px] sm:h-[440px] block cursor-grab active:cursor-grabbing touch-none",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
										x: 0,
										y: 0,
										width: SVG_WIDTH,
										height: SVG_HEIGHT,
										fill: mapColors.seaBg
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
										d: graticulePath,
										fill: "none",
										stroke: mapColors.graticule,
										strokeWidth: .75,
										strokeDasharray: "3 3"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", { children: countryPaths.map((country) => {
										const fill = country.role === "core" ? mapColors.coreLandFill : country.role === "international" ? mapColors.intlLandFill : mapColors.contextLandFill;
										const stroke = country.role === "core" ? mapColors.coreLandStroke : country.role === "international" ? mapColors.intlLandStroke : mapColors.contextLandStroke;
										const strokeWidth = country.role === "core" ? 1.5 : 1;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
											d: country.d,
											fill,
											stroke,
											strokeWidth,
											strokeLinejoin: "round"
										}), country.centroid && country.centroid[0] > 30 && country.centroid[0] < 790 && country.centroid[1] > 24 && country.centroid[1] < 466 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
											x: country.centroid[0],
											y: country.centroid[1],
											textAnchor: "middle",
											dominantBaseline: "central",
											fill: country.role === "core" ? mapColors.coreLabel : mapColors.countryLabel,
											fontSize: country.role === "core" ? 11 : 9.5,
											fontWeight: country.role === "core" ? 700 : 500,
											opacity: .78,
											pointerEvents: "none",
											children: isAr ? country.nameAr : country.nameEn
										})] }, country.id);
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
										pointerEvents: "none",
										children: hydroPaths.map((river) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
											d: river.d,
											fill: "none",
											stroke: mapColors.nileStroke,
											strokeWidth: scale >= 3500 ? 1.8 : 1.15,
											strokeLinecap: "round",
											opacity: .75
										}, river.key))
									}),
									showMobilizationArcs && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
										pointerEvents: "none",
										children: projectedPins.map(({ site, anchorX, anchorY }) => {
											if (site.id === "giza-fleet-depot") return null;
											const dx = anchorX - depotPoint[0];
											const dy = anchorY - depotPoint[1];
											const dist = Math.hypot(dx, dy);
											if (dist < 4) return null;
											const midX = (depotPoint[0] + anchorX) / 2;
											const midY = (depotPoint[1] + anchorY) / 2 - Math.min(55, dist * .18);
											const isFocused = selectedSite.id === site.id || hoveredSiteId === site.id;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
												d: `M ${depotPoint[0].toFixed(1)} ${depotPoint[1].toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${anchorX.toFixed(1)} ${anchorY.toFixed(1)}`,
												fill: "none",
												stroke: isFocused ? mapColors.arcActive : mapColors.arcMuted,
												strokeWidth: isFocused ? 2 : 1.1,
												strokeDasharray: site.countryCode === "EG" ? "5 3" : "3 4",
												opacity: isFocused ? .95 : .45
											}, `arc-${site.id}`);
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", {
										pointerEvents: "none",
										children: projectedPins.map(({ site, anchorX, anchorY, displayX, displayY, displaced }) => {
											const accent = getPinAccent(site.category);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [displaced && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
												x1: anchorX,
												y1: anchorY,
												x2: displayX,
												y2: displayY,
												stroke: mapColors.leaderStroke,
												strokeWidth: 1,
												opacity: .7
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
												cx: anchorX,
												cy: anchorY,
												r: displaced ? 2.6 : 2,
												fill: accent
											})] }, `anchor-${site.id}`);
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", { children: projectedPins.map(({ site, displayX, displayY }) => {
										const isSelected = selectedSite.id === site.id;
										const isHovered = hoveredSiteId === site.id;
										const accent = getPinAccent(site.category);
										const badgeText = site.id === "giza-fleet-depot" ? "16U" : site.pwhtUnitsAllocated > 0 ? `${site.pwhtUnitsAllocated}U` : site.code.split("-")[1] || "NDT";
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
											"data-map-pin": "true",
											"data-testid": `map-pin-${site.id}`,
											role: "button",
											tabIndex: 0,
											"aria-pressed": isSelected,
											"aria-label": `${site.name[language]} — ${site.pwhtUnitsAllocated > 0 ? `${site.pwhtUnitsAllocated} × 65 kW PWHT` : "NDT Inspection"}`,
											transform: `translate(${displayX.toFixed(1)}, ${displayY.toFixed(1)})`,
											onClick: () => setSelectedSiteId(site.id),
											onMouseEnter: () => setHoveredSiteId(site.id),
											onMouseLeave: () => setHoveredSiteId(null),
											onKeyDown: (e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													setSelectedSiteId(site.id);
												}
											},
											className: "cursor-pointer focus:outline-none",
											children: [
												(isSelected || isHovered) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
													cx: 0,
													cy: 0,
													r: isSelected ? 17 : 15,
													fill: "none",
													stroke: accent,
													strokeWidth: isSelected ? 2 : 1.4,
													opacity: .9
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
													cx: 0,
													cy: 0,
													r: isSelected ? 12.5 : 11,
													fill: isSelected ? mapColors.pinPlateSelected : mapColors.pinPlate,
													stroke: accent,
													strokeWidth: isSelected ? 2.5 : 2
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
													x: 0,
													y: .5,
													textAnchor: "middle",
													dominantBaseline: "central",
													fill: isSelected ? mapColors.pinTextSelected : mapColors.pinText,
													fontSize: 8.5,
													fontWeight: 800,
													fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
													children: badgeText
												}),
												(isSelected || isHovered || scale >= 4200) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
													transform: "translate(0, -20)",
													pointerEvents: "none",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
														x: -68,
														y: -11,
														width: 136,
														height: 18,
														rx: 4,
														fill: mapColors.pinPlate,
														stroke: isSelected ? accent : mapColors.contextLandStroke,
														strokeWidth: 1,
														opacity: .94
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
														x: 0,
														y: -1.5,
														textAnchor: "middle",
														dominantBaseline: "central",
														fill: mapColors.pinText,
														fontSize: 8.5,
														fontWeight: 700,
														children: site.shortName[language]
													})]
												})
											]
										}, site.id);
									}) })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "px-3.5 py-2.5 border-t border-slate-800 bg-slate-950/95 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2.5 h-2.5 rounded-full border-2 border-amber-500 inline-block" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "مخازن الأسطول والمقر (16U)" : "HQ & 16-Unit Depot" })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2.5 h-2.5 rounded-full border-2 border-cyan-400 inline-block" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "محطات توليد الكهرباء" : "Power Plants" })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2.5 h-2.5 rounded-full border-2 border-emerald-400 inline-block" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "المجمعات الصناعية" : "Industrial" })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2.5 h-2.5 rounded-full border-2 border-rose-400 inline-block" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "البترول والمشروعات الدولية" : "Oil, Gas & Intl." })]
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono tabular-nums text-[10px] text-slate-500",
									children: isAr ? "اسحب الخريطة للتحريك أو اختر موقعاً" : "Drag map to pan · Click any pin"
								})]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-slate-800 bg-slate-950/70 p-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between text-xs text-slate-400 mb-2 px-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-slate-300",
								children: isAr ? `دليل المواقع المعروضة (${filteredSites.length})` : `Displayed Sites Directory (${filteredSites.length})`
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-[11px] tabular-nums",
								children: isAr ? "انقر لعرض ملف التعبئة" : "Select site to inspect fleet scope"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1",
							children: filteredSites.map((site) => {
								const isSelected = selectedSite.id === site.id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									"data-testid": `directory-site-${site.id}`,
									onClick: () => handleSelectSiteFromDirectory(site),
									className: `w-full text-start px-3 py-2 rounded-lg border text-xs transition cursor-pointer flex items-center justify-between gap-2 ${isSelected ? "border-cyan-500 bg-cyan-950/25 text-white" : "border-slate-800/80 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "font-bold text-slate-100 truncate",
											children: site.shortName[language]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[11px] text-slate-400 truncate",
											children: site.client
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono tabular-nums text-[11px] font-semibold text-cyan-400 shrink-0",
										children: site.id === "giza-fleet-depot" ? "16 × 65kW" : site.pwhtUnitsAllocated > 0 ? `${site.pwhtUnitsAllocated} × 65kW` : "NDT"
									})]
								}, site.id);
							})
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					"data-testid": "regional-map-site-dossier",
					className: "lg:col-span-5 rounded-xl border border-slate-800 bg-slate-950/80 p-5 space-y-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3 border-b border-slate-800 pb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-center gap-1.5 text-xs font-mono text-slate-400 tabular-nums",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-cyan-400 font-bold",
												children: selectedSite.code
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												"aria-hidden": "true",
												children: "·"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: getRegionalCategoryLabel(selectedSite.category, isAr) }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												"aria-hidden": "true",
												children: "·"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
												selectedSite.coordinates[1].toFixed(2),
												"°N, ",
												selectedSite.coordinates[0].toFixed(2),
												"°E"
											] })
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "text-base sm:text-lg font-bold text-white leading-snug",
										children: selectedSite.name[language]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5 text-xs text-slate-400",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, {
											className: "w-3.5 h-3.5 text-cyan-400 shrink-0",
											"aria-hidden": "true"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: selectedSite.location[language] })]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => handleFocusSite(selectedSite),
								title: isAr ? "تركيز وتكبير الموقع على الخريطة" : "Center & zoom to site on map",
								className: "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-cyan-300 transition cursor-pointer shrink-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crosshair, {
									className: "w-3.5 h-3.5",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "تركيز" : "Focus" })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-3 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-slate-800 bg-slate-900/50 p-3 space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[11px] text-slate-400",
									children: isAr ? "العميل / المقاول العام" : "Client / EPC Contractor"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-bold text-slate-100 leading-snug",
									children: selectedSite.client
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg border border-slate-800 bg-slate-900/50 p-3 space-y-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] text-slate-400",
										children: isAr ? "مسافة التحرك من ورش الجيزة" : "Mobilization from Giza Depot"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-mono font-bold text-cyan-400 tabular-nums",
										children: selectedDistanceKm === 0 ? isAr ? "0 كم (المقر المركزي)" : "0 km (Central Base)" : isAr ? `${selectedDistanceKm.toLocaleString("en-US")} كم` : `${selectedDistanceKm.toLocaleString("en-US")} km`
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] text-slate-400",
										children: selectedSite.dispatchWindow[language]
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 text-xs font-bold text-white",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, {
											className: "w-4 h-4 text-amber-400 shrink-0",
											"aria-hidden": "true"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "تخصيص أسطول المعالجة الحرارية (65 kW)" : "PWHT 65 kW Fleet Allocation" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-mono text-xs font-bold text-amber-400 tabular-nums",
										children: [
											selectedSite.id === "giza-fleet-depot" ? `16 / 16` : `${selectedSite.pwhtUnitsAllocated} / 16`,
											" ",
											isAr ? "وحدات" : "Units"
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									role: "img",
									"aria-label": isAr ? `تمثيل وحدات المعالجة الحرارية المخصصة من أصل 16 وحدة` : `Visual meter showing allocated PWHT units out of 16 owned units`,
									className: "grid grid-cols-16 gap-1",
									children: Array.from({ length: 16 }).map((_, idx) => {
										const isAllocated = idx < (selectedSite.id === "giza-fleet-depot" ? 16 : selectedSite.pwhtUnitsAllocated);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											title: `INS-PWHT-${String(idx + 1).padStart(2, "0")}`,
											className: `h-2.5 rounded-xs transition-colors ${isAllocated ? "bg-amber-500" : "bg-slate-800"}`
										}, idx);
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-slate-300 leading-snug",
									children: selectedSite.pwhtRoleLabel[language]
								}),
								selectedSite.serialAllocation && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-[11px] font-mono text-slate-400 tabular-nums",
									children: [
										isAr ? "النطاق التسلسلي:" : "Serial Block:",
										" ",
										selectedSite.serialAllocation
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs font-semibold text-slate-300",
								children: isAr ? "نطاق الأعمال المنفذة بالموقع" : "Executed Site Engineering Scope"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-slate-400 leading-relaxed",
								children: selectedSite.scopeSummary[language]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs font-semibold text-slate-300",
								children: isAr ? "طرق الفحص المطبقة بالموقع (انقر لعرض مواصفات الطريقة أدناه)" : "Site NDT Methods (Click to inspect method specifications below)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap items-center gap-1.5",
								children: selectedSite.ndtMethods.map((methodCode) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => onSelectNdtMethod?.(methodCode),
									className: "px-2.5 py-1 rounded-md border border-slate-700 bg-slate-900 hover:border-cyan-500/60 hover:text-cyan-300 text-xs font-mono font-semibold text-slate-200 transition cursor-pointer",
									children: methodCode
								}, methodCode))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pt-3 border-t border-slate-800 space-y-2 text-xs text-slate-400",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-1.5 font-mono text-[11px]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
									className: "w-3.5 h-3.5 text-cyan-400 shrink-0",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: selectedSite.governingCodes.join(" · ") })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center justify-between gap-2 pt-1",
								children: [selectedSite.evidenceRef && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-[11px] font-mono text-slate-400",
									children: [
										isAr ? "مرجع التوثيق:" : "Evidence:",
										" ",
										selectedSite.evidenceRef
									]
								}), onNavigateToAcademyModule && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => onNavigateToAcademyModule("pwht_curve"),
									className: "inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition cursor-pointer",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, {
										className: "w-3.5 h-3.5",
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "محاكاة دورة PWHT بالأكاديمية" : "Simulate PWHT Cycle" })]
								})]
							})]
						})
					]
				})]
			})
		]
	});
};
//#endregion
//#region src/components/company/CompanyServicesSection.tsx
var CompanyServicesSection = ({ language, onNavigateToAcademyModule, onOpenDemo, onOpenService }) => {
	const isAr = language === "ar";
	const ArrowIcon = isAr ? ChevronLeft : ChevronRight;
	const [activeCategory, setActiveCategory] = (0, import_react.useState)("all");
	const [selectedMethodId, setSelectedMethodId] = (0, import_react.useState)("UT");
	const pwhtImagePath = COMPANY_MEDIA.pwhtHeatTreatment;
	const rtImagePath = COMPANY_MEDIA.radiographyGammaScan;
	const pautImagePath = COMPANY_MEDIA.pautFlawDetector;
	const categories = [
		{
			id: "all",
			label: {
				ar: "كافة الطرق المعروضة",
				en: "All listed methods"
			}
		},
		{
			id: "volumetric",
			label: {
				ar: "الفحوصات الحجمية (Volumetric)",
				en: "Volumetric NDT"
			}
		},
		{
			id: "surface",
			label: {
				ar: "الفحوصات السطحية (Surface)",
				en: "Surface NDT"
			}
		},
		{
			id: "analysis",
			label: {
				ar: "التحليل والصلادة (Field Metallurgy)",
				en: "Field Analysis"
			}
		},
		{
			id: "pressure",
			label: {
				ar: "الضغط والمعالجة (Pressure & PWHT)",
				en: "Heat & Pressure"
			}
		}
	];
	const filteredMethods = COMMERCIAL_NDT_METHODS.filter((method) => {
		if (activeCategory === "all") return true;
		if (activeCategory === "volumetric") return [
			"UT",
			"RT",
			"PAUT"
		].includes(method.code);
		if (activeCategory === "surface") return [
			"VT",
			"MT",
			"PT",
			"PC"
		].includes(method.code);
		if (activeCategory === "analysis") return ["PMI", "HT"].includes(method.code);
		if (activeCategory === "pressure") return ["HYDRO", "SR"].includes(method.code);
		return true;
	});
	const selectedMethod = COMMERCIAL_NDT_METHODS.find((m) => m.code === selectedMethodId) || COMMERCIAL_NDT_METHODS[0];
	const handleSelectMethodFromMap = (methodCode) => {
		setActiveCategory("all");
		setSelectedMethodId(methodCode);
		const catalogEl = document.getElementById("ndt-methods-catalog");
		if (catalogEl) catalogEl.scrollIntoView({
			behavior: "smooth",
			block: "start"
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		id: "services",
		className: "py-16 border-b border-slate-800 bg-slate-950",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-7xl mx-auto px-4 sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionHeading, {
					className: "mb-12",
					eyebrow: isAr ? "مجالات العمل والمعدات" : "Inspection and heat treatment",
					title: isAr ? "طرق الفحص غير الإتلافي والمعالجة الحرارية" : "NDT methods and heat treatment",
					description: isAr ? "تعرّف على الاستخدامات والمراجع الشائعة لكل طريقة. يراجع الفريق الفني الإجراء المطلوب والمعدات المتاحة لكل مشروع." : "Compare typical applications and references. The technical team confirms the applicable procedure and equipment for your project."
				}),
				onOpenService && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-14",
					children: SERVICE_FAMILIES.map((family) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => onOpenService(family.id),
						className: "group text-start rounded-xl border border-slate-800 bg-slate-900/50 hover:border-cyan-500/50 p-4 transition cursor-pointer",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-bold text-white group-hover:text-cyan-200 transition",
								children: family.title[language]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-1 text-xs text-slate-400",
								children: family.short[language]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-400",
								children: [isAr ? "تفاصيل الخدمة" : "Service details", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowIcon, { className: "w-3 h-3" })]
							})
						]
					}, family.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-14 rounded-2xl border border-slate-800 bg-linear-to-br from-slate-900/90 to-cyan-950/20 p-6 sm:p-8 overflow-hidden shadow-2xl",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 lg:grid-cols-12 gap-8 items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "lg:col-span-7 space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Flame, { className: "w-6 h-6" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-xl font-bold text-white",
										children: INSCO_COMPANY_DATA.pwhtFleet.title[language]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-cyan-400 font-mono",
										children: isAr ? "المصدر: ملف الشركة المنشور" : "Source: published company profile"
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-slate-300 leading-relaxed",
									children: INSCO_COMPANY_DATA.pwhtFleet.description[language]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2",
									children: INSCO_COMPANY_DATA.pwhtFleet.features.map((feat, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start gap-2 text-xs text-slate-300",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-4 h-4 text-cyan-400 shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: feat[language] })]
									}, i))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2 pt-2 text-xs font-mono text-slate-400",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-slate-500",
										children: isAr ? "الأكواد المطبقة:" : "Governing Codes:"
									}), INSCO_COMPANY_DATA.pwhtFleet.codes.map((code, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "px-2 py-0.5 rounded bg-slate-800/80 text-slate-200 border border-slate-700/60",
										children: code
									}, idx))]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pt-2 flex flex-wrap items-center gap-3",
									children: [onNavigateToAcademyModule && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => onNavigateToAcademyModule("pwht_curve"),
										className: "inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/50 rounded-lg transition cursor-pointer",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "محاكي منحنيات PWHT التفاعلي" : "Open PWHT Curve Simulator" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-slate-400 font-mono",
										children: isAr ? "أكّد توافر المعدات ونطاق العمل مع الفريق الفني." : "Confirm equipment availability and scope with the technical team."
									})]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							"data-preserve-dark": "true",
							className: "lg:col-span-5 relative rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 group",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: pwhtImagePath,
									alt: isAr ? "عملية المعالجة الحرارية بعد اللحام PWHT" : "PWHT post weld heat treatment operation",
									referrerPolicy: "no-referrer",
									loading: "lazy",
									className: "w-full h-64 sm:h-72 object-cover transition duration-700 group-hover:scale-105"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "absolute top-3 left-3 right-3 flex items-center justify-between text-[11px] font-mono pointer-events-none",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "px-2.5 py-1 rounded bg-slate-950/85 backdrop-blur-md border border-rose-500/40 text-rose-400 flex items-center gap-1.5 font-bold",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Thermometer, { className: "w-3.5 h-3.5 text-rose-500 animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "742°C / 750°C SOAK" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "px-2.5 py-1 rounded bg-slate-950/85 backdrop-blur-md border border-slate-700 text-slate-200",
										children: [
											INSCO_COMPANY_DATA.pwhtFleet.unitCount,
											" ",
											isAr ? "وحدات 65 kW" : "Units"
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "absolute bottom-3 left-3 right-3 p-2.5 rounded-lg bg-slate-950/90 backdrop-blur-md border border-slate-800 text-xs text-slate-300 flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-bold text-white text-[11px]",
										children: isAr ? "وحدة معالجة حرارية 65 kW أوتوماتيكية" : "65 kW Automatic Programmed Unit"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[10px] text-slate-400 font-mono",
										children: "AWS D10.10 & ASME B31.3 · 6-Channel Strip Recorder"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-end font-mono text-xs font-black text-cyan-400",
										children: ["16 ", isAr ? "وحدة" : "Units"]
									})]
								})
							]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompanyRegionalFleetMap, {
					language,
					onSelectNdtMethod: handleSelectMethodFromMap,
					onNavigateToAcademyModule
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					id: "ndt-methods-catalog",
					className: "space-y-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-lg font-bold text-white",
							children: isAr ? "فهرس طرق الفحص غير الإتلافي" : "Non-Destructive Testing Methods Catalog"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-slate-400",
							children: isAr ? "اختر الطريقة للاطلاع على المعدات والرمز والكود الهندسي المرجعي" : "Select a method to review typical equipment and reference specifications"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg",
							children: categories.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setActiveCategory(cat.id),
								className: `px-3 py-1.5 text-xs font-medium rounded-md transition cursor-pointer ${activeCategory === cat.id ? "bg-cyan-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`,
								children: cat.label[language]
							}, cat.id))
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 lg:grid-cols-12 gap-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "lg:col-span-5 space-y-2 max-h-[500px] overflow-y-auto pr-1",
							children: filteredMethods.map((method) => {
								const isSelected = selectedMethod.code === method.code;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setSelectedMethodId(method.code),
									className: `w-full text-start p-3.5 rounded-lg border transition cursor-pointer flex items-center justify-between gap-3 ${isSelected ? "border-cyan-500 bg-cyan-950/20 text-white" : "border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700 hover:bg-slate-900/70"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "px-2 py-1 rounded bg-slate-800 text-cyan-400 font-mono text-xs font-bold border border-slate-700/60",
											children: method.code
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs font-bold text-slate-200",
											children: method.name[language]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[11px] text-slate-400",
											children: method.category[language]
										})] })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowIcon, { className: `w-4 h-4 shrink-0 transition ${isSelected ? "text-cyan-400" : "text-slate-600"}` })]
								}, method.code);
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-4 border-b border-slate-800 pb-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-lg font-mono font-black text-cyan-400",
												children: selectedMethod.code
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												"aria-hidden": "true",
												className: "text-slate-600",
												children: "·"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-slate-400 font-medium",
												children: selectedMethod.category[language]
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "text-lg font-bold text-white mt-1",
										children: selectedMethod.name[language]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-end font-mono text-xs text-slate-400",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: isAr ? "الكود المرجعي:" : "Standard:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-cyan-300 font-semibold",
											children: selectedMethod.standards
										})]
									})]
								}),
								selectedMethod.code === "RT" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative rounded-lg overflow-hidden border border-purple-500/30 group",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: rtImagePath,
											alt: isAr ? "جهاز التصوير الإشعاعي الصناعي جاما" : "Industrial gamma radiographic testing device",
											referrerPolicy: "no-referrer",
											loading: "lazy",
											className: "w-full h-48 object-cover transition duration-500 group-hover:scale-102"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/20 to-transparent" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "absolute bottom-2 left-3 right-3 text-[11px] font-mono text-slate-200 flex justify-between items-center",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-purple-300",
												children: isAr ? "مثال لجهاز تصوير إشعاعي صناعي" : "Illustrative radiography equipment"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "px-2 py-0.5 rounded bg-purple-950/80 border border-purple-700/60 text-purple-200",
												children: "Spec 150 / Sentinel"
											})]
										})
									]
								}) : selectedMethod.code === "PAUT" || selectedMethod.code === "UT" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative rounded-lg overflow-hidden border border-cyan-500/30 group",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: pautImagePath,
											alt: isAr ? "جهاز فحص الموجات فوق الصوتية والمصفوفات الطورية" : "Phased array ultrasonic flaw detector S-scan",
											referrerPolicy: "no-referrer",
											loading: "lazy",
											className: "w-full h-48 object-cover transition duration-500 group-hover:scale-102"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/20 to-transparent" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "absolute bottom-2 left-3 right-3 text-[11px] font-mono text-slate-200 flex justify-between items-center",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-cyan-300",
												children: isAr ? "مسح قطاعي S-Scan للكشف عن عيوب جذر اللحام" : "Sectorial S-Scan Root Flaw Imaging"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/60 text-cyan-200",
												children: "Olympus OmniScan"
											})]
										})
									]
								}) : null,
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5",
									children: isAr ? "نطاق الفحص والتطبيق الصناعي:" : "Operational Scope & Industrial Application:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-slate-300 leading-relaxed",
									children: selectedMethod.description[language]
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-lg bg-slate-950/70 border border-slate-800 p-4 space-y-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-xs font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "أمثلة لمعدات الفحص:" : "Approved & Calibrated Equipment Fleet:" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs text-slate-300 leading-relaxed font-mono",
										children: selectedMethod.equipment[language]
									})]
								}),
								onNavigateToAcademyModule && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "متاح في معمل المحاكاة ثلاثي الأبعاد بالأكاديمية" : "Simulate this method in the Academy Virtual Lab" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => onNavigateToAcademyModule(selectedMethod.code === "RT" ? "rt_lab" : "workshops"),
										className: "text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1 cursor-pointer",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isAr ? "فتح المحاكاة التفاعلية" : "Launch 3D Lab" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowIcon, { className: "w-3.5 h-3.5" })]
									})]
								})
							]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-14 grid grid-cols-1 md:grid-cols-3 gap-6",
					children: INSCO_COMPANY_DATA.services.map((svc) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-6 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 transition space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "p-2 rounded-lg bg-slate-800 text-cyan-400 border border-slate-700",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wrench, { className: "w-5 h-5" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "text-base font-bold text-white",
									children: svc.title[language]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-slate-300 leading-relaxed",
								children: svc.description[language]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-1.5 pt-2 border-t border-slate-800/80",
								children: svc.highlights.map((hl, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 text-xs text-slate-400",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: hl[language] })]
								}, idx))
							})
						]
					}, svc.id))
				}),
				onOpenDemo && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm font-bold text-white",
						children: isAr ? "شاهد كيف نقرأ الإشارة قبل أن نحكم" : "See how we read the signal before judging"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-slate-400 max-w-xl leading-relaxed",
						children: isAr ? "محاكي دورة PWHT، عارض أفلام إشعاعية، ومعمل UT/PAUT — كلها في صفحة عرض فني واحدة، بلا مزاحمة للمحتوى التجاري." : "PWHT cycle simulator, radiographic film lightbox and the UT/PAUT lab — together on one demonstrations page, without crowding the commercial content."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: onOpenDemo,
						className: "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 text-xs font-bold transition whitespace-nowrap cursor-pointer",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "w-4 h-4" }),
							isAr ? "افتح العرض الفني" : "Open demonstrations",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowIcon, { className: "w-3.5 h-3.5" })
						]
					})]
				})
			]
		})
	});
};
//#endregion
export { CompanyServicesSection };
