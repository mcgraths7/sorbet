#!/usr/bin/env python3
"""Regenerates the two fixtures tools/test-contracts.ts holds the simulation to:
simulate-cvd.json (simulateCvd's display hex) and separation-clamp.json (what
separation() must answer for pairs whose simulated channel exceeds 1 before
the clamp; specification M10.10).

HOW THESE VALUES WERE MADE. Written by the test author, in Python, from the
text of the specification alone (section M7: the sRGB decode, the three
Machado, Oliveira & Fernandes 2009 severity-1.0 matrices, the clamp, the sRGB
encode, "times 255, rounded to the nearest integer"), BEFORE simulateCvd
existed. It shares no code with src/tokens/color.ts or tools/check-cvd.ts, was
not checked against either, and is not the measuring kit the specification's
own numbers came from. That independence is the point: a fixture produced by
the function it checks compares a matrix with itself and proves nothing.

Standard library only. Run from anywhere:

    python3 simulate_cvd.py            # rewrites both fixtures beside it
    python3 simulate_cvd.py --check    # exits 1 if either file on disk differs

It refuses to emit a value whose channel lands within 1e-6 of a rounding
boundary: two correct implementations may differ in the last bit of a power
function, and a fixture must not turn that into a failure.

THE CLAMP FIXTURE (added for M10.10, same rules: from the specification's text,
no shared code). separation() with a view simulates both colours in linear
RGB, clamps each channel to 0..1 and takes the clamped LINEAR values straight
to OKLab; the answer is the Euclidean distance times 100. None of the
specification's twelve check values has a channel above 1 after the matrix, so
an implementation that lost the upper clamp would still reproduce all twelve.
Each pair in CLAMP_PAIRS has at least one channel above 1 before the clamp;
the script refuses a pair that does not, and refuses one whose answer moves by
less than 0.01 when the clamp is left out, so every row can tell the two
apart. Both numbers are written: `separation` is the answer, `unclamped` is
what an implementation without the upper clamp would say (the lower clamp
kept), there so the test can show the row bites.

Before writing anything the script reproduces the specification's own twelve
separation check values (M7's table) to 1e-9 and the five published OKLab
values to 1e-6. If its arithmetic disagreed with the specification it would
stop, and no fixture would be written from it.
"""

import json
import math
import os
import sys

MATRICES = {
    "protan": (
        (0.152286, 1.052583, -0.204868),
        (0.114503, 0.786281, 0.099216),
        (-0.003882, -0.048116, 1.051998),
    ),
    "deutan": (
        (0.367322, 0.860646, -0.227968),
        (0.280085, 0.672501, 0.047413),
        (-0.011820, 0.042940, 0.968881),
    ),
    "tritan": (
        (1.255528, -0.076749, -0.178779),
        (-0.078411, 0.930809, 0.147602),
        (0.004733, 0.691367, 0.303900),
    ),
}

# Primaries (where a row goes negative and the clamp does the work), black and
# white (where it must change nothing but the clamp at 1), three chart colours
# from the specification's separation table, and three arbitrary ones.
COLOURS = [
    "#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff",
    "#008289", "#9e6400", "#ec5198", "#0f70d5",
    "#123456", "#c0ffee", "#7f7f7f",
]


def decode(byte):
    c = byte / 255.0
    if c <= 0.04045:
        return c / 12.92
    return math.pow((c + 0.055) / 1.055, 2.4)


def encode(v):
    if v <= 0.0031308:
        return v * 12.92
    return 1.055 * math.pow(v, 1.0 / 2.4) - 0.055


def simulate(colour, kind):
    linear = [decode(int(colour[i:i + 2], 16)) for i in (1, 3, 5)]
    out = "#"
    for row in MATRICES[kind]:
        mixed = sum(weight * channel for weight, channel in zip(row, linear))
        clamped = min(1.0, max(0.0, mixed))
        scaled = encode(clamped) * 255.0
        nearest = math.floor(scaled + 0.5)
        if abs(scaled - nearest) > 0.5 - 1e-6:
            raise SystemExit("%s under %s sits on a rounding boundary; pick another colour" % (colour, kind))
        out += "%02x" % nearest
    return out


# -- OKLab and separation (M7; M10.10) ---------------------------------------

def cbrt(x):
    return math.copysign(math.pow(abs(x), 1.0 / 3.0), x)


def oklab(linear):
    r, g, b = linear
    l = cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
    m = cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
    s = cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
    return (
        0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
        1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
        0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
    )


def linear_of(colour):
    return [decode(int(colour[i:i + 2], 16)) for i in (1, 3, 5)]


def mixed(colour, view):
    """The matrix applied to the linear channels, before any clamp."""
    linear = linear_of(colour)
    return [sum(weight * channel for weight, channel in zip(row, linear)) for row in MATRICES[view]]


def seen(colour, view, upper_clamp=True):
    if view is None:
        return linear_of(colour)
    return [max(0.0, min(1.0, v) if upper_clamp else v) for v in mixed(colour, view)]


def separation(a, b, view=None, upper_clamp=True):
    p = oklab(seen(a, view, upper_clamp))
    q = oklab(seen(b, view, upper_clamp))
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(p, q))) * 100.0


# The specification's own check values (M7), which this script must reproduce
# before it is trusted to produce a value the specification does not state.
SPEC_SEPARATIONS = [
    ("#008289", "#9e6400", 19.472571036629873, 14.61818592879111, 15.742857549545816, 21.169819272558314),
    ("#ec5198", "#8a6f00", 26.53416007752937, 16.89457050891632, 15.850368872011622, 19.410368065524125),
    ("#0f70d5", "#e8672e", 35.36055657939406, 26.220374004871775, 33.59562229960631, 32.90604947566381),
]
SPEC_OKLAB = [
    ("#ff0000", (0.627955, 0.224863, 0.125846)),
    ("#00ff00", (0.866440, -0.233888, 0.179498)),
    ("#0000ff", (0.452014, -0.032457, -0.311528)),
    ("#000000", (0.0, 0.0, 0.0)),
    ("#ffffff", (1.0, 0.0, 0.0)),
]


def self_check():
    for colour, lab in SPEC_OKLAB:
        got = oklab(linear_of(colour))
        if any(abs(x - y) > 1e-6 for x, y in zip(got, lab)):
            raise SystemExit("this script's OKLab of %s is %r; the specification says %r" % (colour, got, lab))
    for a, b, none, protan, deutan, tritan in SPEC_SEPARATIONS:
        for view, want in ((None, none), ("protan", protan), ("deutan", deutan), ("tritan", tritan)):
            got = separation(a, b, view)
            if abs(got - want) > 1e-9:
                raise SystemExit("this script's separation of %s and %s (%s) is %r; the specification says %r" % (a, b, view, got, want))


# Each pair: at least one channel above 1 after the matrix. Green and blue
# under protan (rows 1 and 3), yellow under deutan (row 1), red under tritan
# (row 1): every matrix has a row that overshoots.
CLAMP_PAIRS = [
    ("#00ff00", "#ffffff", "protan"),
    ("#00ff00", "#000000", "protan"),
    ("#0000ff", "#000000", "protan"),
    ("#00ff00", "#0000ff", "protan"),
    ("#ffff00", "#008289", "deutan"),
    ("#ffff00", "#000000", "deutan"),
    ("#ff0000", "#9e6400", "tritan"),
    ("#ff0000", "#000000", "tritan"),
]


def build_clamp():
    self_check()
    rows = []
    for a, b, view in CLAMP_PAIRS:
        over = max(mixed(a, view) + mixed(b, view))
        if over <= 1.0 + 1e-3:
            raise SystemExit("%s and %s under %s: no channel exceeds 1 before the clamp (%r); the pair pins nothing" % (a, b, view, over))
        clamped = separation(a, b, view)
        unclamped = separation(a, b, view, upper_clamp=False)
        if abs(clamped - unclamped) < 0.01:
            raise SystemExit("%s and %s under %s: the clamp moves the answer by under 0.01; the pair pins nothing" % (a, b, view))
        rows.append({"a": a, "b": b, "view": view, "over": over, "separation": clamped, "unclamped": unclamped})
    return {
        "madeBy": "tools/fixtures/contracts/simulate_cvd.py - an independent Python implementation of specification sections M7 and M10.10; see its docstring",
        "what": "separation(a, b, view): OKLab distance x100 of the two colours as simulated, each linear channel clamped to 0..1. `over` is the largest channel before the clamp; `unclamped` is the answer without the upper clamp",
        "clamped": rows,
    }


def render_clamp(data):
    rows = ",\n".join("    " + json.dumps(row) for row in data["clamped"])
    return '{\n  "madeBy": %s,\n  "what": %s,\n  "clamped": [\n%s\n  ]\n}\n' % (json.dumps(data["madeBy"]), json.dumps(data["what"]), rows)


def build():
    return {
        "madeBy": "tools/fixtures/contracts/simulate_cvd.py - an independent Python implementation of specification section M7; see its docstring",
        "simulated": [
            {"color": colour, "kind": kind, "hex": simulate(colour, kind)}
            for colour in COLOURS
            for kind in ("protan", "deutan", "tritan")
        ],
    }


def render(data):
    rows = ",\n".join("    " + json.dumps(row) for row in data["simulated"])
    return '{\n  "madeBy": %s,\n  "simulated": [\n%s\n  ]\n}\n' % (json.dumps(data["madeBy"]), rows)


if __name__ == "__main__":
    here = os.path.dirname(os.path.abspath(__file__))
    files = [
        (os.path.join(here, "simulate-cvd.json"), render(build()), "%d values" % len(build()["simulated"])),
        (os.path.join(here, "separation-clamp.json"), render_clamp(build_clamp()), "%d pairs" % len(CLAMP_PAIRS)),
    ]
    if "--check" in sys.argv:
        same = True
        for path, text, _ in files:
            with open(path, encoding="utf-8") as handle:
                if handle.read() != text:
                    print("%s is not what this script writes" % path)
                    same = False
        sys.exit(0 if same else 1)
    for path, text, count in files:
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(text)
        print("wrote %s (%s)" % (path, count))
