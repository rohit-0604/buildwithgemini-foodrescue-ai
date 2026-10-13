#!/usr/bin/env python3
"""
FoodRescue AI - 60-Second Fast Pitch Demo Video Recorder
Automates Playwright and generates synchronized neural voiceover narration.
"""

import os
import sys
import time
import subprocess
import json
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT_DIR / "public"
TEMP_DIR = Path("/tmp/foodrescue_60s_recording")
TEMP_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

EDGE_TTS_BIN = "/tmp/demovenv/bin/edge-tts"
FALLBACK_VOICES = [
    "en-US-ChristopherNeural",
    "en-US-AndrewMultilingualNeural",
    "en-US-GuyNeural",
    "en-US-BrianNeural"
]

SCENES = [
    {
        "id": "s1_intro",
        "narration": (
            "Food insecurity meets urban surplus food. "
            "Welcome to FoodRescue AI, an autonomous multi-agent logistics network "
            "powered by Gemini 2.5 Flash on Google Cloud Vertex AI."
        ),
        "role": "DONOR",
    },
    {
        "id": "s2_donor",
        "narration": (
            "Commercial kitchen staff simply type or speak in natural language. "
            "In seconds, Gemini extracts sixty hot meals, verifies safe holding temperatures, "
            "and confirms statutory FSSAI compliance with our embedded safety engine."
        ),
        "role": "DONOR",
    },
    {
        "id": "s3_ngo_vol",
        "narration": (
            "Partner shelters receive instant capacity-aware proposals with flexible quantity sliders. "
            "Our matching engine pairs the mission with an insulated volunteer vehicle, "
            "logging verified physical temperatures at pickup to guarantee safety."
        ),
        "role": "NGO_VOLUNTEER",
    },
    {
        "id": "s4_coordinator",
        "narration": (
            "In the Command Center, coordinators track real-time KPIs, trigger automated replanning, "
            "and inspect live traces across all nineteen autonomous tools. "
            "Food saved, zero waste, deployed live on Google Cloud."
        ),
        "role": "COORDINATOR",
    }
]

def generate_voiceovers():
    print("🎙 Generating 60-second neural voiceover narration...")
    durations = {}
    
    for scene in SCENES:
        sid = scene["id"]
        audio_file = TEMP_DIR / f"{sid}.mp3"
        clean_text = scene["narration"].replace("—", ", ").replace("–", ", ")
        
        if audio_file.exists() and audio_file.stat().st_size > 1000:
            print(f"  ✓ {sid} already generated, skipping.")
            success = True
        else:
            success = False
            for voice_candidate in FALLBACK_VOICES:
                print(f"  Attempting {sid} with voice {voice_candidate}...")
                cmd = [
                    EDGE_TTS_BIN,
                    "--voice", voice_candidate,
                    "--rate=+8%",
                    "--text", clean_text,
                    "--write-media", str(audio_file)
                ]
                res = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                if res.returncode == 0 and audio_file.exists() and audio_file.stat().st_size > 1000:
                    success = True
                    print(f"  ✓ {sid} generated successfully with {voice_candidate}")
                    break
                time.sleep(1.5)
            
        if not success:
            raise RuntimeError(f"Failed to generate voiceover for {sid}")

        probe_cmd = [
            "ffprobe", "-i", str(audio_file),
            "-show_entries", "format=duration",
            "-v", "quiet", "-of", "csv=p=0"
        ]
        out = subprocess.check_output(probe_cmd).decode().strip()
        dur = float(out)
        durations[sid] = dur
        print(f"  ✓ {sid}: {dur:.2f} seconds")
        
    total_dur = sum(durations.values())
    print(f"📊 Total voiceover length: {total_dur:.2f} seconds")
    return durations

def reset_database():
    print("🔄 Resetting database to clean initial state...")
    try:
        import urllib.request
        req = urllib.request.Request("http://localhost:8080/api/demo/reset", method="POST")
        with urllib.request.urlopen(req) as resp:
            pass
        print("  ✓ Database reset successfully.")
    except Exception as e:
        print(f"  ⚠️ Warning resetting db: {e}")

def record_browser_session(durations):
    from playwright.sync_api import sync_playwright

    video_record_dir = TEMP_DIR / "browser_video"
    video_record_dir.mkdir(parents=True, exist_ok=True)

    print("🎬 Starting Playwright browser automation (1920x1080)...")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            executable_path="/usr/bin/google-chrome",
            args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
        )
        context = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            record_video_dir=str(video_record_dir),
            record_video_size={"width": 1920, "height": 1080}
        )
        page = context.new_page()

        # ==========================================
        # SCENE 1: Introduction (App overview)
        # ==========================================
        print("  ▶ Recording Scene 1: Introduction")
        page.goto("http://localhost:8080", wait_until="networkidle")
        time.sleep(1.5)
        
        s1_dur = durations["s1_intro"]
        start_time = time.time()
        
        # Hover over badges
        try:
            page.hover("text=Gemini 2.5 Flash")
            time.sleep(1.0)
            page.hover("text=Hyderabad Metro")
            time.sleep(1.0)
        except Exception:
            pass
            
        remaining = s1_dur - (time.time() - start_time)
        if remaining > 0:
            time.sleep(remaining)

        # ==========================================
        # SCENE 2: Donor Intake & Gemini Extraction
        # ==========================================
        print("  ▶ Recording Scene 2: Donor Intake & Extraction")
        start_time = time.time()
        s2_dur = durations["s2_donor"]
        
        page.click("text=Paradise Biryani (60 Hot Meals)")
        time.sleep(1.0)
        page.click("text=Extract Details with Gemini")
        time.sleep(4.5)  # Wait for live Gemini extraction
        
        page.evaluate("window.scrollTo({top: 300, behavior: 'smooth'})")
        time.sleep(1.5)
        page.click("text=Submit Donation to FoodRescue Network")
        time.sleep(2.5)
        
        remaining = s2_dur - (time.time() - start_time)
        if remaining > 0:
            time.sleep(remaining)

        # ==========================================
        # SCENE 3: NGO Portal & Volunteer Dispatch
        # ==========================================
        print("  ▶ Recording Scene 3: NGO Acceptance & Volunteer Transit")
        start_time = time.time()
        s3_dur = durations["s3_ngo_vol"]
        
        page.evaluate("window.scrollTo({top: 0, behavior: 'smooth'})")
        time.sleep(0.5)
        page.click("button:has-text('NGO / Shelter')")
        time.sleep(2.0)
        
        try:
            accept_btn = page.wait_for_selector("button:has-text('Accept')", timeout=4000)
            if accept_btn:
                accept_btn.click()
                time.sleep(1.5)
        except Exception:
            pass
            
        # Switch to Volunteer view
        try:
            page.click("button:has-text('Volunteer')")
            time.sleep(2.0)
        except Exception as e:
            print(f"    Volunteer click notice: {e}")
        
        # Fill pickup temp if present
        try:
            temp_input = page.wait_for_selector("input[type='number']", timeout=3000)
            if temp_input:
                temp_input.fill("64")
                time.sleep(0.8)
                pickup_btn = page.query_selector("button:has-text('Confirm Pickup')")
                if pickup_btn:
                    pickup_btn.click()
                    time.sleep(1.5)
        except Exception:
            pass
            
        remaining = s3_dur - (time.time() - start_time)
        if remaining > 0:
            time.sleep(remaining)

        # ==========================================
        # SCENE 4: Coordinator Command Center & Traces
        # ==========================================
        print("  ▶ Recording Scene 4: Coordinator Command Center")
        start_time = time.time()
        s4_dur = durations["s4_coordinator"]
        
        page.evaluate("window.scrollTo({top: 0, behavior: 'smooth'})")
        try:
            page.click("button:has-text('Coordinator')")
            time.sleep(2.0)
        except Exception as e:
            print(f"    Coordinator click notice: {e}")
        
        # Scroll to inspect KPIs and trace drawer
        page.evaluate("window.scrollTo({top: 450, behavior: 'smooth'})")
        time.sleep(2.5)
        page.evaluate("window.scrollTo({top: 150, behavior: 'smooth'})")
        time.sleep(2.0)
        
        remaining = s4_dur - (time.time() - start_time)
        if remaining > 0:
            time.sleep(remaining + 2.0)  # Clean 2s hold on final screen

        page.close()
        context.close()
        browser.close()

    recorded_files = list(video_record_dir.glob("*.webm"))
    if not recorded_files:
        raise RuntimeError("No recorded webm found from Playwright!")
    latest_video = max(recorded_files, key=os.path.getctime)
    print(f"  ✓ Raw browser video captured: {latest_video} ({latest_video.stat().st_size / 1024 / 1024:.2f} MB)")
    return latest_video

def assemble_final_video(video_path, durations):
    print("🎬 Assembling and master-encoding 60-second video with FFmpeg...")
    
    # 1. Concatenate audio clips
    concat_list = TEMP_DIR / "audio_concat.txt"
    with open(concat_list, "w") as f:
        for scene in SCENES:
            sid = scene["id"]
            audio_path = TEMP_DIR / f"{sid}.mp3"
            f.write(f"file '{audio_path}'\n")

    combined_audio = TEMP_DIR / "combined_narration.mp3"
    subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", str(concat_list),
        "-c", "copy",
        str(combined_audio)
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Measure total audio duration
    probe_cmd = [
        "ffprobe", "-i", str(combined_audio),
        "-show_entries", "format=duration",
        "-v", "quiet", "-of", "csv=p=0"
    ]
    audio_dur = float(subprocess.check_output(probe_cmd).decode().strip())
    print(f"  ✓ Master Audio Duration: {audio_dur:.2f} seconds")

    final_public_mp4 = OUTPUT_DIR / "foodrescue_ai_60s_demo.mp4"
    desktop_mp4 = Path("/config/Desktop/FoodRescue_AI_60s_Demo.mp4")

    # 2. Multiplex video and audio with H.264 / AAC
    cmd = [
        "ffmpeg", "-y",
        "-i", str(video_path),
        "-i", str(combined_audio),
        "-filter_complex",
        f"[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p[v];[1:a]afade=t=in:ss=0:d=0.5,afade=t=out:st={audio_dur - 0.8}:d=0.8[a]",
        "-map", "[v]",
        "-map", "[a]",
        "-c:v", "libx264",
        "-preset", "faster",
        "-crf", "22",
        "-r", "25",
        "-c:a", "aac",
        "-b:a", "128k",
        "-shortest",
        str(final_public_mp4)
    ]
    print("  Running FFmpeg encode...")
    subprocess.run(cmd, check=True)

    # Copy to Desktop
    import shutil
    shutil.copy2(final_public_mp4, desktop_mp4)
    
    file_size_mb = final_public_mp4.stat().st_size / (1024 * 1024)
    print("\n" + "="*60)
    print("🎉 60-SECOND DEMO VIDEO SUCCESSFULLY PRODUCED!")
    print(f"📁 Public Path:  {final_public_mp4}")
    print(f"🖥 Desktop Path: {desktop_mp4}")
    print(f"📊 Video Size:   {file_size_mb:.2f} MB")
    print(f"⏱ Duration:     ~{audio_dur:.1f} seconds")
    print("="*60 + "\n")

if __name__ == "__main__":
    reset_database()
    durs = generate_voiceovers()
    reset_database()
    raw_video = record_browser_session(durs)
    assemble_final_video(raw_video, durs)
