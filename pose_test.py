"""
DEHA — Real-Time Body Pose Tracker
====================================
Python 3.10.2 | MediaPipe Tasks API | OpenCV | NumPy

Place pose_landmarker_lite.task in the same folder as this script.

Controls:
  1  →  Mountain Pose      (Tadasana)
  2  →  Warrior I          (Virabhadrasana I)
  3  →  Warrior II         (Virabhadrasana II)
  4  →  Tree Pose          (Vrksasana)
  5  →  T-Pose             (calibration / neutral)
  ESC → Quit
"""

import cv2
import mediapipe as mp
import numpy as np
import time
import math

# ─────────────────────────────────────────────────────────────────────────────
#  MEDIAPIPE TASKS SETUP
# ─────────────────────────────────────────────────────────────────────────────
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision

MODEL_PATH = "pose_landmarker_lite.task"

BaseOptions          = mp.tasks.BaseOptions
PoseLandmarker       = vision.PoseLandmarker
PoseLandmarkerOptions = vision.PoseLandmarkerOptions
VisionRunningMode    = vision.RunningMode

options = PoseLandmarkerOptions(
    base_options=BaseOptions(model_asset_path=MODEL_PATH),
    running_mode=VisionRunningMode.VIDEO,
    num_poses=1,
    min_pose_detection_confidence=0.55,
    min_pose_presence_confidence=0.55,
    min_tracking_confidence=0.55,
)

# ─────────────────────────────────────────────────────────────────────────────
#  COLOUR PALETTE  (all in BGR for OpenCV)
# ─────────────────────────────────────────────────────────────────────────────
CLR_GREEN      = (80,  190, 100)   # correct
CLR_RED        = (60,   60, 210)   # incorrect  (BGR red)
CLR_GOLD       = (30,  175, 212)   # gold UI accent
CLR_WHITE      = (235, 235, 235)
CLR_OFFWHITE   = (200, 195, 190)
CLR_PANEL      = (28,  18,  18)    # dark panel background
CLR_PANEL2     = (42,  28,  28)    # slightly lighter panel
CLR_ROSE       = (145, 125, 180)   # muted rose text
CLR_DARK_GREEN = (40,  120,  60)
CLR_DARK_RED   = (30,   30, 130)

# ─────────────────────────────────────────────────────────────────────────────
#  LANDMARK INDEX SHORTCUTS
#  MediaPipe Pose gives 33 landmarks (0-32).
#  We use the world-normalised pixel coords from the image result.
# ─────────────────────────────────────────────────────────────────────────────
IDX = {
    "nose":         0,
    "l_eye_inner":  1,  "l_eye":  2,  "l_eye_outer": 3,
    "r_eye_inner":  4,  "r_eye":  5,  "r_eye_outer": 6,
    "l_ear":        7,  "r_ear":  8,
    "l_mouth":      9,  "r_mouth": 10,
    "l_shoulder":  11,  "r_shoulder": 12,
    "l_elbow":     13,  "r_elbow":    14,
    "l_wrist":     15,  "r_wrist":    16,
    "l_pinky":     17,  "r_pinky":    18,
    "l_index":     19,  "r_index":    20,
    "l_thumb":     21,  "r_thumb":    22,
    "l_hip":       23,  "r_hip":      24,
    "l_knee":      25,  "r_knee":     26,
    "l_ankle":     27,  "r_ankle":    28,
    "l_heel":      29,  "r_heel":     30,
    "l_foot":      31,  "r_foot":     32,
}

# ─────────────────────────────────────────────────────────────────────────────
#  SKELETON CONNECTIONS
#  Each tuple: (landmark_name_A, landmark_name_B, body_region)
#  body_region is used for coarse grouping if needed later.
# ─────────────────────────────────────────────────────────────────────────────
SKELETON_CONNECTIONS = [
    # Head
    ("l_ear",       "l_eye",        "head"),
    ("r_ear",       "r_eye",        "head"),
    ("l_eye",       "nose",         "head"),
    ("r_eye",       "nose",         "head"),
    # Torso
    ("l_shoulder",  "r_shoulder",   "torso"),
    ("l_shoulder",  "l_hip",        "torso"),
    ("r_shoulder",  "r_hip",        "torso"),
    ("l_hip",       "r_hip",        "torso"),
    # Left arm
    ("l_shoulder",  "l_elbow",      "l_arm"),
    ("l_elbow",     "l_wrist",      "l_arm"),
    # Right arm
    ("r_shoulder",  "r_elbow",      "r_arm"),
    ("r_elbow",     "r_wrist",      "r_arm"),
    # Left leg
    ("l_hip",       "l_knee",       "l_leg"),
    ("l_knee",      "l_ankle",      "l_leg"),
    ("l_ankle",     "l_heel",       "l_leg"),
    ("l_heel",      "l_foot",       "l_leg"),
    # Right leg
    ("r_hip",       "r_knee",       "r_leg"),
    ("r_knee",      "r_ankle",      "r_leg"),
    ("r_ankle",     "r_heel",       "r_leg"),
    ("r_heel",      "r_foot",       "r_leg"),
]

# ─────────────────────────────────────────────────────────────────────────────
#  ANGLE CALCULATION
# ─────────────────────────────────────────────────────────────────────────────
def calc_angle(a, b, c):
    """
    Returns the angle in degrees at point B, formed by A-B-C.
    a, b, c are (x, y) tuples in pixel coordinates.
    """
    ax, ay = a[0] - b[0], a[1] - b[1]
    cx, cy = c[0] - b[0], c[1] - b[1]
    dot     = ax * cx + ay * cy
    mag_a   = math.hypot(ax, ay)
    mag_c   = math.hypot(cx, cy)
    if mag_a * mag_c == 0:
        return 0.0
    cosine  = max(-1.0, min(1.0, dot / (mag_a * mag_c)))
    return math.degrees(math.acos(cosine))


def get_pt(landmarks, name, w, h):
    """Return pixel (x, y) for a named landmark."""
    lm = landmarks[IDX[name]]
    return (int(lm.x * w), int(lm.y * h))


# ─────────────────────────────────────────────────────────────────────────────
#  IDEAL POSE DEFINITIONS
#
#  Each pose is a dict of joint checks. Each check defines:
#    "points"  : (A, B, C) — angle is measured at B
#    "range"   : (min_deg, max_deg) — acceptable angle range
#    "label"   : short human-readable name shown in feedback
#    "fix"     : correction instruction shown when incorrect
#
#  These ranges are intentionally permissive for a "simple first version".
#  You can tighten them later once you have angle measurement data.
# ─────────────────────────────────────────────────────────────────────────────
POSES = {

    "Mountain Pose": {
        "key": "1",
        "checks": [
            {
                "points": ("l_shoulder", "l_hip", "l_knee"),
                "range":  (165, 195),
                "label":  "Left hip alignment",
                "fix":    "Straighten left side — hip is not neutral",
            },
            {
                "points": ("r_shoulder", "r_hip", "r_knee"),
                "range":  (165, 195),
                "label":  "Right hip alignment",
                "fix":    "Straighten right side — hip is not neutral",
            },
            {
                "points": ("l_hip", "l_knee", "l_ankle"),
                "range":  (165, 195),
                "label":  "Left knee",
                "fix":    "Straighten the left knee fully",
            },
            {
                "points": ("r_hip", "r_knee", "r_ankle"),
                "range":  (165, 195),
                "label":  "Right knee",
                "fix":    "Straighten the right knee fully",
            },
            {
                "points": ("l_elbow", "l_shoulder", "l_hip"),
                "range":  (150, 210),
                "label":  "Left arm",
                "fix":    "Relax left arm straight alongside the body",
            },
            {
                "points": ("r_elbow", "r_shoulder", "r_hip"),
                "range":  (150, 210),
                "label":  "Right arm",
                "fix":    "Relax right arm straight alongside the body",
            },
        ],
    },

    "Warrior I": {
        "key": "2",
        "checks": [
            {
                "points": ("l_hip", "l_knee", "l_ankle"),
                "range":  (75, 105),
                "label":  "Front knee bend",
                "fix":    "Bend front knee to 90° over the ankle",
            },
            {
                "points": ("r_hip", "r_knee", "r_ankle"),
                "range":  (155, 185),
                "label":  "Back leg",
                "fix":    "Straighten the back leg fully",
            },
            {
                "points": ("l_elbow", "l_shoulder", "l_hip"),
                "range":  (155, 210),
                "label":  "Left arm raise",
                "fix":    "Raise the left arm straight overhead",
            },
            {
                "points": ("r_elbow", "r_shoulder", "r_hip"),
                "range":  (155, 210),
                "label":  "Right arm raise",
                "fix":    "Raise the right arm straight overhead",
            },
            {
                "points": ("l_shoulder", "l_hip", "l_knee"),
                "range":  (155, 195),
                "label":  "Torso upright",
                "fix":    "Keep the torso upright — do not lean forward",
            },
        ],
    },

    "Warrior II": {
        "key": "3",
        "checks": [
            {
                "points": ("l_hip", "l_knee", "l_ankle"),
                "range":  (75, 105),
                "label":  "Front knee",
                "fix":    "Bend front knee to 90° — track over second toe",
            },
            {
                "points": ("r_hip", "r_knee", "r_ankle"),
                "range":  (155, 185),
                "label":  "Back leg",
                "fix":    "Straighten the back leg completely",
            },
            {
                "points": ("l_elbow", "l_shoulder", "r_shoulder"),
                "range":  (155, 205),
                "label":  "Left arm extension",
                "fix":    "Extend left arm fully parallel to the floor",
            },
            {
                "points": ("r_elbow", "r_shoulder", "l_shoulder"),
                "range":  (155, 205),
                "label":  "Right arm extension",
                "fix":    "Extend right arm fully parallel to the floor",
            },
        ],
    },

    "Tree Pose": {
        "key": "4",
        "checks": [
            {
                "points": ("l_hip", "l_knee", "l_ankle"),
                "range":  (155, 185),
                "label":  "Standing leg",
                "fix":    "Straighten the standing leg fully",
            },
            {
                "points": ("r_hip", "r_knee", "r_ankle"),
                "range":  (30, 90),
                "label":  "Raised leg",
                "fix":    "Bend the raised knee outward and press foot to thigh",
            },
            {
                "points": ("l_elbow", "l_shoulder", "l_hip"),
                "range":  (155, 210),
                "label":  "Left arm",
                "fix":    "Raise left arm overhead — reach through fingertips",
            },
            {
                "points": ("r_elbow", "r_shoulder", "r_hip"),
                "range":  (155, 210),
                "label":  "Right arm",
                "fix":    "Raise right arm overhead — reach through fingertips",
            },
        ],
    },

    "T-Pose (neutral)": {
        "key": "5",
        "checks": [
            {
                "points": ("l_elbow", "l_shoulder", "l_hip"),
                "range":  (80, 100),
                "label":  "Left arm horizontal",
                "fix":    "Raise left arm to shoulder height — perfectly horizontal",
            },
            {
                "points": ("r_elbow", "r_shoulder", "r_hip"),
                "range":  (80, 100),
                "label":  "Right arm horizontal",
                "fix":    "Raise right arm to shoulder height — perfectly horizontal",
            },
            {
                "points": ("l_hip", "l_knee", "l_ankle"),
                "range":  (165, 195),
                "label":  "Left leg straight",
                "fix":    "Straighten the left leg fully",
            },
            {
                "points": ("r_hip", "r_knee", "r_ankle"),
                "range":  (165, 195),
                "label":  "Right leg straight",
                "fix":    "Straighten the right leg fully",
            },
        ],
    },
}

POSE_NAMES = list(POSES.keys())


# ─────────────────────────────────────────────────────────────────────────────
#  JOINT → WHICH CHECKS IT BELONGS TO
#  Used to colour individual joints by correctness.
# ─────────────────────────────────────────────────────────────────────────────
def build_joint_status(landmarks, pose_name, w, h):
    """
    Returns:
      joint_status : dict  { landmark_name : True (correct) | False (incorrect) }
      feedback     : list  of str correction messages
      score        : int   0-100 accuracy score
    """
    checks    = POSES[pose_name]["checks"]
    joint_status = {}
    feedback  = []
    passed    = 0

    for check in checks:
        a_name, b_name, c_name = check["points"]
        a = get_pt(landmarks, a_name, w, h)
        b = get_pt(landmarks, b_name, w, h)
        c = get_pt(landmarks, c_name, w, h)
        angle = calc_angle(a, b, c)

        lo, hi = check["range"]
        ok = lo <= angle <= hi

        if ok:
            passed += 1
        else:
            feedback.append(check["fix"])

        # Mark all three joints involved in this check
        for name in (a_name, b_name, c_name):
            # If any check fails for this joint, mark red; green only if all pass
            if name not in joint_status:
                joint_status[name] = ok
            else:
                joint_status[name] = joint_status[name] and ok

    score = int((passed / len(checks)) * 100) if checks else 100
    return joint_status, feedback, score


# ─────────────────────────────────────────────────────────────────────────────
#  DRAWING HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def draw_rounded_rect(img, x1, y1, x2, y2, radius, color, alpha=0.80):
    """Draw a semi-transparent filled rounded rectangle."""
    overlay = img.copy()
    cv2.rectangle(overlay, (x1 + radius, y1), (x2 - radius, y2), color, -1)
    cv2.rectangle(overlay, (x1, y1 + radius), (x2, y2 - radius), color, -1)
    for cx, cy in [(x1+radius, y1+radius), (x2-radius, y1+radius),
                   (x1+radius, y2-radius), (x2-radius, y2-radius)]:
        cv2.circle(overlay, (cx, cy), radius, color, -1)
    cv2.addWeighted(overlay, alpha, img, 1 - alpha, 0, img)


def draw_text_with_shadow(img, text, pos, font, scale, color, thickness=1):
    """Draw text with a subtle dark shadow for readability over camera."""
    x, y = pos
    cv2.putText(img, text, (x+1, y+1), font, scale, (10, 10, 10), thickness + 1, cv2.LINE_AA)
    cv2.putText(img, text, pos, font, scale, color, thickness, cv2.LINE_AA)


def draw_skeleton(frame, landmarks, joint_status, w, h):
    """
    Draw bones (lines) and joints (circles) on the frame.
    Each bone and joint is coloured green if correct, red if incorrect.
    """
    BONE_THICKNESS  = 3
    JOINT_RADIUS    = 6
    JOINT_THICKNESS = -1  # filled

    for (name_a, name_b, _) in SKELETON_CONNECTIONS:
        if name_a not in IDX or name_b not in IDX:
            continue

        pt_a = get_pt(landmarks, name_a, w, h)
        pt_b = get_pt(landmarks, name_b, w, h)

        # Bone colour: red if either endpoint is incorrect, else green
        ok_a = joint_status.get(name_a, True)
        ok_b = joint_status.get(name_b, True)
        color = CLR_GREEN if (ok_a and ok_b) else CLR_RED

        cv2.line(frame, pt_a, pt_b, color, BONE_THICKNESS, cv2.LINE_AA)

    # Draw joint circles on top of bones
    for name in IDX:
        lm = landmarks[IDX[name]]
        # Skip face-internal landmarks for cleaner look
        if name in ("l_eye_inner", "r_eye_inner", "l_eye_outer", "r_eye_outer",
                    "l_mouth", "r_mouth", "l_pinky", "r_pinky",
                    "l_index", "r_index", "l_thumb", "r_thumb"):
            continue
        px = int(lm.x * w)
        py = int(lm.y * h)
        ok    = joint_status.get(name, True)
        color = CLR_GREEN if ok else CLR_RED

        # Outer glow ring
        cv2.circle(frame, (px, py), JOINT_RADIUS + 3, color, 1, cv2.LINE_AA)
        # Filled joint
        cv2.circle(frame, (px, py), JOINT_RADIUS, color, JOINT_THICKNESS, cv2.LINE_AA)
        # Bright centre dot
        cv2.circle(frame, (px, py), 2, CLR_WHITE, -1, cv2.LINE_AA)


def draw_feedback_panel(frame, pose_name, feedback, score, fps, H, W):
    """
    Draw a right-side panel showing:
      - Current pose name
      - Accuracy score ring (text approximation)
      - Live correction list (up to 3 items)
      - FPS counter
    """
    PANEL_W = 300
    PANEL_X = W - PANEL_W
    MARGIN   = 14
    FONT     = cv2.FONT_HERSHEY_SIMPLEX
    FONT_SM  = 0.42
    FONT_MD  = 0.52
    FONT_LG  = 0.72

    # Panel background
    draw_rounded_rect(frame, PANEL_X, 0, W, H, 0, CLR_PANEL, alpha=0.82)

    # Gold top accent bar
    cv2.rectangle(frame, (PANEL_X, 0), (W, 3), CLR_GOLD, -1)

    y = 28

    # ── Pose name ──
    draw_text_with_shadow(frame, "DEHA", (PANEL_X + MARGIN, y), FONT, FONT_LG, CLR_GOLD, 2)
    y += 26
    cv2.line(frame, (PANEL_X + MARGIN, y), (W - MARGIN, y), CLR_GOLD, 1, cv2.LINE_AA)
    y += 14

    draw_text_with_shadow(frame, "Pose", (PANEL_X + MARGIN, y), FONT, FONT_SM, CLR_ROSE, 1)
    y += 18
    # Wrap long pose name
    words   = pose_name.split()
    line    = ""
    for word in words:
        test = line + word + " "
        size = cv2.getTextSize(test, FONT, FONT_MD, 1)[0][0]
        if size > PANEL_W - 2 * MARGIN and line:
            draw_text_with_shadow(frame, line.strip(), (PANEL_X + MARGIN, y), FONT, FONT_MD, CLR_WHITE, 1)
            y += 20
            line = word + " "
        else:
            line = test
    if line.strip():
        draw_text_with_shadow(frame, line.strip(), (PANEL_X + MARGIN, y), FONT, FONT_MD, CLR_WHITE, 1)
    y += 24

    # ── Score bar ──
    cv2.line(frame, (PANEL_X + MARGIN, y), (W - MARGIN, y), CLR_PANEL2, 1)
    y += 14

    draw_text_with_shadow(frame, "Accuracy", (PANEL_X + MARGIN, y), FONT, FONT_SM, CLR_ROSE, 1)
    y += 18

    score_color = CLR_GREEN if score >= 70 else (CLR_GOLD if score >= 40 else CLR_RED)
    score_text  = f"{score}%"
    draw_text_with_shadow(frame, score_text, (PANEL_X + MARGIN, y), FONT, FONT_LG, score_color, 2)
    y += 8

    # Score progress bar
    bar_x1 = PANEL_X + MARGIN
    bar_x2 = W - MARGIN
    bar_y  = y
    bar_h  = 6
    bar_w  = bar_x2 - bar_x1
    fill_w = int(bar_w * score / 100)
    cv2.rectangle(frame, (bar_x1, bar_y), (bar_x2, bar_y + bar_h), CLR_PANEL2, -1)
    cv2.rectangle(frame, (bar_x1, bar_y), (bar_x1 + fill_w, bar_y + bar_h), score_color, -1)
    y += bar_h + 16

    cv2.line(frame, (PANEL_X + MARGIN, y), (W - MARGIN, y), CLR_PANEL2, 1)
    y += 14

    # ── Feedback corrections ──
    draw_text_with_shadow(frame, "Corrections", (PANEL_X + MARGIN, y), FONT, FONT_SM, CLR_ROSE, 1)
    y += 18

    if not feedback:
        draw_text_with_shadow(frame, "Form looks good — hold it!", (PANEL_X + MARGIN, y),
                               FONT, FONT_SM, CLR_GREEN, 1)
        y += 20
    else:
        for i, msg in enumerate(feedback[:3]):   # max 3 shown
            # Bullet dot
            cv2.circle(frame, (PANEL_X + MARGIN + 4, y - 4), 3, CLR_RED, -1)
            # Word-wrap each message
            words   = msg.split()
            line    = ""
            first   = True
            for word in words:
                test = line + word + " "
                size = cv2.getTextSize(test, FONT, FONT_SM, 1)[0][0]
                max_w = PANEL_W - 2 * MARGIN - 14
                if size > max_w and line:
                    x_off = PANEL_X + MARGIN + 14 if first else PANEL_X + MARGIN + 14
                    draw_text_with_shadow(frame, line.strip(), (x_off, y), FONT, FONT_SM, CLR_OFFWHITE, 1)
                    y    += 16
                    first = False
                    line  = word + " "
                else:
                    line = test
            if line.strip():
                x_off = PANEL_X + MARGIN + 14
                draw_text_with_shadow(frame, line.strip(), (x_off, y), FONT, FONT_SM, CLR_OFFWHITE, 1)
                y += 20

    y += 4
    cv2.line(frame, (PANEL_X + MARGIN, y), (W - MARGIN, y), CLR_PANEL2, 1)
    y += 14

    # ── Pose switcher hints ──
    draw_text_with_shadow(frame, "Switch pose:", (PANEL_X + MARGIN, y), FONT, FONT_SM, CLR_ROSE, 1)
    y += 16
    for name, data in POSES.items():
        short = name.split("(")[0].strip()
        hint  = f"[{data['key']}] {short}"
        draw_text_with_shadow(frame, hint, (PANEL_X + MARGIN, y), FONT, FONT_SM, CLR_ROSE, 1)
        y += 15

    y += 6
    cv2.line(frame, (PANEL_X + MARGIN, y), (W - MARGIN, y), CLR_PANEL2, 1)
    y += 14

    # ── FPS ──
    draw_text_with_shadow(frame, f"FPS: {fps:.0f}", (PANEL_X + MARGIN, y), FONT, FONT_SM, CLR_ROSE, 1)
    draw_text_with_shadow(frame, "ESC to quit", (PANEL_X + MARGIN + 80, y), FONT, FONT_SM, CLR_ROSE, 1)


def draw_top_badge(frame, pose_name, score, W):
    """Small status badge at top-left of the camera view."""
    FONT   = cv2.FONT_HERSHEY_SIMPLEX
    FONT_S = 0.45
    text   = f"  {pose_name}   {score}%  "
    color  = CLR_GREEN if score >= 70 else (CLR_GOLD if score >= 40 else CLR_RED)
    (tw, th), _ = cv2.getTextSize(text, FONT, FONT_S, 1)
    draw_rounded_rect(frame, 10, 10, tw + 20, th + 22, 6, CLR_PANEL, alpha=0.75)
    cv2.putText(frame, text, (15, 28), FONT, FONT_S, color, 1, cv2.LINE_AA)


# ─────────────────────────────────────────────────────────────────────────────
#  MAIN LOOP
# ─────────────────────────────────────────────────────────────────────────────
def main():
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH,  1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    cap.set(cv2.CAP_PROP_FPS,          30)

    if not cap.isOpened():
        print("[ERROR] Cannot open camera. Check that your webcam is connected.")
        return

    # Window setup
    WIN = "Deha — pose_test"
    cv2.namedWindow(WIN, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(WIN, 1280, 720)

    current_pose_idx = 0
    fps_prev_time    = time.time()
    fps              = 0.0

    # Smoothing: keep a small rolling buffer of scores to reduce jitter
    SCORE_BUFFER_SIZE = 6
    score_buffer      = []

    start_ns = time.time_ns()   # monotonic start for timestamps

    print("\n  Deha Pose Tracker started.")
    print("  Keys: 1-5 to switch pose   |   ESC to quit\n")

    with PoseLandmarker.create_from_options(options) as landmarker:
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                print("[WARNING] Empty camera frame. Retrying…")
                continue

            # Mirror so it feels like a mirror
            frame = cv2.flip(frame, 1)
            H, W  = frame.shape[:2]

            # Camera region is left side (panel takes right 300 px)
            PANEL_W = 300
            CAM_W   = W - PANEL_W

            # ── MediaPipe inference ──
            rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_img = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            ts_ms  = (time.time_ns() - start_ns) // 1_000_000   # monotonic ms

            result = landmarker.detect_for_video(mp_img, ts_ms)

            # ── Current pose ──
            pose_name = POSE_NAMES[current_pose_idx]
            feedback  = ["Waiting for body detection…"]
            score     = 0

            if result.pose_landmarks and len(result.pose_landmarks) > 0:
                landmarks = result.pose_landmarks[0]

                joint_status, feedback, score = build_joint_status(
                    landmarks, pose_name, W, H
                )

                # Smooth the score
                score_buffer.append(score)
                if len(score_buffer) > SCORE_BUFFER_SIZE:
                    score_buffer.pop(0)
                score = int(sum(score_buffer) / len(score_buffer))

                # Draw skeleton only over the camera region (clip to CAM_W)
                draw_skeleton(frame, landmarks, joint_status, W, H)
            else:
                score_buffer.clear()

            # ── FPS ──
            now       = time.time()
            fps       = 1.0 / max(now - fps_prev_time, 1e-6)
            fps_prev_time = now

            # ── UI ──
            draw_feedback_panel(frame, pose_name, feedback, score, fps, H, W)
            draw_top_badge(frame, pose_name, score, W)

            # ── Show ──
            cv2.imshow(WIN, frame)

            # ── Key handling ──
            key = cv2.waitKey(1) & 0xFF
            if key == 27:           # ESC
                break
            elif key == ord('1'):
                current_pose_idx = 0
                score_buffer.clear()
            elif key == ord('2'):
                current_pose_idx = 1
                score_buffer.clear()
            elif key == ord('3'):
                current_pose_idx = 2
                score_buffer.clear()
            elif key == ord('4'):
                current_pose_idx = 3
                score_buffer.clear()
            elif key == ord('5'):
                current_pose_idx = 4
                score_buffer.clear()

    cap.release()
    cv2.destroyAllWindows()
    print("  Session ended.")


if __name__ == "__main__":
    main()