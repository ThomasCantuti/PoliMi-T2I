from harness import Test

TITLE = 'Exam · Jul 2022 · Simple reflex agent for a light-seeking robot'
DIFFICULTY = 'easy'
KIND = 'code'
TAGS = ['exam', 'Jul 2022', 'simple reflex agent', 'condition-action rules', 'rule order']

STATEMENT = r"""
*Written exam of 14 July 2022 — Problem 2 (Intelligent Agent Architectures, 8 points).*

A simple robot must reach a light source. It has:

- two **light sensors** in front, one on the left and one on the right, each returning a number from 0 (no light)
  to 10 (maximum light): `ReadLightSensorLeft()`, `ReadLightSensorRight()`. A light on the robot's left gives a
  higher value on the left sensor, and vice versa;
- two **wheels**, left and right, each moving forward, backward or staying still: `RotateWheels(x, y)` moves the
  left wheel forward if `x = 1`, backward if `x = -1`, keeps it still if `x = 0` (same for `y` and the right wheel).
  `RotateWheels(1, -1)` rotates the robot to the **right**; `RotateWheels(-1, 1)` to the **left**.

Required behaviour:

1. if the sensors perceive **no light**, the robot rotates until some light is perceived by at least one sensor;
2. when light is perceived, it moves **towards** it until **both** sensors perceive the maximum (10); then it
   **stops**.

**Question 1.** Draw the general architecture of a simple reflex agent. **Question 2.** Write a set of **at most
ten** condition–action rules that implement the behaviour (explain your notation).

Implement the rules as the agent program `light_robot(left, right)`: it receives the two sensor readings (the
current percept) and returns the pair `(x, y)` to pass to `RotateWheels`. With no light either rotation direction
is accepted.
"""

STARTER = '''def light_robot(left: int, right: int) -> tuple[int, int]:
    # condition-action rules, checked in order: the first one that matches fires
    # TODO
    return (0, 0)
'''

SOLUTION = '''def light_robot(left: int, right: int) -> tuple[int, int]:
    if left == 10 and right == 10:   # 1. light reached: stop
        return (0, 0)
    if left == 0 and right == 0:     # 2. no light: rotate (right) to look for it
        return (1, -1)
    if left > right:                 # 3. light on the left: rotate left
        return (-1, 1)
    if left < right:                 # 4. light on the right: rotate right
        return (1, -1)
    return (1, 1)                    # 5. same light on both sides: it is straight ahead, go forward
'''

HINTS = [
    'A simple reflex agent has no memory: the action depends only on `(left, right)`. Write one `if` per rule.',
    'Which way should it turn when the left sensor reads more? Towards the light: left, i.e. `(-1, 1)`.',
    'Order matters: `left == right` is also true for `(0, 0)` and `(10, 10)`. Put the stop and the no-light rules '
    'first.',
]

EXPLANATION = r"""
**Question 1 — architecture** (slides p.37; AIMA §2.4.2):

```text
            ┌──────────── Agent ─────────────┐
 percept ──►│ Sensors → "what the world is   │
            │            like now"           │
            │               │                │      Environment
            │  condition–   ▼                │
            │  action  →  "what action I     │
            │  rules       should do now"    │
 action  ◄──│               → Effectors      │
            └────────────────────────────────┘
```

The sensors give the current percept, the rule-matching step finds the first condition–action rule whose
condition holds, and its action is sent to the effectors. No internal state.

**Question 2 — rules** (official solution, `if … then RotateWheels(…)`, the first applicable rule fires):

| # | condition | action |
|---|---|---|
| 1 | Left = 10 and Right = 10 | RotateWheels(0, 0) — stop |
| 2 | Left = 0 and Right = 0 | RotateWheels(1, −1) — rotate to look for light |
| 3 | Left > Right | RotateWheels(−1, 1) — rotate left, towards the light |
| 4 | Left < Right | RotateWheels(1, −1) — rotate right |
| 5 | Left = Right | RotateWheels(1, 1) — light straight ahead: move forward |

> **Exam trap:** the official table writes the rules without saying that they are tried **in order**, but rule 5
> also matches (0, 0) and (10, 10). State it ("the agent applies the first rule that matches"), or make the
> conditions disjoint (rule 5: Left = Right and 0 < Left < 10).

Why a simple reflex agent is enough: the right action depends only on the **current** readings (the comparison
left vs right tells where the light is). A model-based agent would be needed if, for example, the light could
disappear temporarily and the robot had to remember where it last saw it.
"""

ENTRY = 'light_robot'


def _rotation(got, *args):
    return got in [(1, -1), (-1, 1)], 'no light: rotate in place, (1, -1) or (-1, 1)'


TESTS = [
    Test('maximum light on both sensors: stop', args=(10, 10), expected=(0, 0)),
    Test('no light: rotate in place', args=(0, 0), check=_rotation),
    Test('light on the left', args=(7, 3), expected=(-1, 1)),
    Test('light on the right', args=(2, 9), expected=(1, -1)),
    Test('light straight ahead', args=(5, 5), expected=(1, 1)),
    Test('almost there, light slightly left', args=(10, 9), expected=(-1, 1)),
    Test('only the right sensor sees light', args=(0, 4), expected=(1, -1)),
    Test('weak light straight ahead', args=(1, 1), expected=(1, 1)),
]
