#!/usr/bin/env python3
"""
FoodRescue AI - Automated Demo Video Recorder with Synchronized Voiceover
Uses Playwright (headless Chrome) for pixel-perfect UI capture
and Edge-TTS for high-definition neural narration.
"""

import os
import sys
import time
import subprocess
import json
from pathlib import Path

# Paths
ROOT_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = ROOT_DIR / "public"
TEMP_DIR = Path("/tmp/foodrescue_recording")
TEMP_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

EDGE_TTS_BIN = "/tmp/demovenv/bin/edge-tts"
PYTHON_BIN = "/tmp/demovenv/bin/python3"
VOICE = "en-US-AndrewMultilingualNeural"

SCENES = [
    {
        "id": "scene1_intro",
        "narration": (
            "Welcome to FoodRescue AI, an autonomous multi-agent food redistribution network "
            "built on Google Cloud Vertex AI using Gemini 2.5 Flash. "
            "In metropolitan areas like Hyderabad, commercial kitchens produce wholesome surplus food daily, "
            "yet connecting it to local shelters is hampered by tight time windows, food safety regulations, "
            "and volunteer logistics. FoodRescue AI bridges this gap with five autonomous agents and nineteen specialized tools."
        ),
        "role": "DONOR",
    },
    {
        "id": "scene2_donor_intake",
        "narration": (
            "Commercial kitchen managers don't have time to fill out complex thirty-field forms. "
            "With FoodRescue AI, donors simply describe surplus food in natural language. "
            "Watch as we submit sixty portions of hot chicken biryani kept in warmers at 64 degrees Celsius. "
            "In real time, Gemini 2.5 Flash extracts item quantities, holding temperatures, and allergen tags, "
            "while the Safety Agent queries our embedded RAG engine to verify compliance with FSSAI 2019 hot-holding standards."
        ),
        "role": "DONOR",
    },
    {
        "id": "scene3_ngo_portal",
        "narration": (
            "The moment surplus is submitted, the Discovery and Matching Agents calculate feasible allocations "
            "and broadcast a proposal directly to nearby verified partner organizations. "
            "In the NGO portal for Akshaya Patra Community Hub, coordinators see the incoming sixty-meal proposal "
            "along with storage and dietary parameters. Recipient shelters can accept full allocations, "
            "or adjust the partial quantity slider when storage capacity is constrained, then confirm with a single click."
        ),
        "role": "NGO",
    },
    {
        "id": "scene4_volunteer_fleet",
        "narration": (
            "Next, our Matching Agent pairs the mission with an optimal volunteer vehicle based on route and thermal capacity. "
            "Switching to the Volunteer Fleet Hub, driver Snoor Jahan receives the assignment with direct route waypoints. "
            "At physical pickup, the driver inputs the verified holding temperature, ensuring an unbroken cold-chain audit trail "
            "before commencing transit."
        ),
        "role": "VOLUNTEER",
    },
    {
        "id": "scene5_coordinator_oversight",
        "narration": (
            "Finally, human coordinators maintain complete oversight in the Central Command Center. "
            "Supervisors review real-time KPI metrics, AI reasoning summaries, and statutory FSSAI and WHO citations. "
            "If an emergency occurs, like a volunteer breakdown, the dynamic replanning engine re-routes the surplus without data loss. "
            "Every single agent action is captured in the immutable execution trace viewer, giving coordinators total auditability "
            "from kitchen to community."
        ),
        "role": "COORDINATOR",
    }
]

def generate_voiceovers():
    print("🎙 Generating neural voiceover audio for each scene...")
    durations = {}
    fallback_voices = [VOICE, "en-US-ChristopherNeural", "en-US-BrianNeural"]
    
    for scene in SCENES:
        sid = scene["id"]
        audio_file = TEMP_DIR / f"{sid}.mp3"
        clean_text = scene["narration"].replace("—", ", ").replace("–", ", ")
        
        # Check if already generated and valid
        if audio_file.exists() and audio_file.stat().st_size > 1000:
            print(f"  ✓ {sid} already generated, skipping.")
        else:
            success = False
            for voice_candidate in fallback_voices:
                print(f"  Generating {sid} with voice {voice_candidate}...")
                cmd = [
                    EDGE_TTS_BIN,
                    "--voice", voice_candidate,
                    "--text", clean_text,
                    "--write-media", str(audio_file)
                ]
                res = subprocess.run(cmd)
                if res.returncode == 0 and audio_file.exists() and audio_file.stat().st_size > 1000:
                    success = True
                    break
                time.sleep(2)
            if not success:
                raise RuntimeError(f"Failed to generate voiceover for {sid}")

        # Measure duration with ffprobe
        probe_cmd = [
            "ffprobe", "-i", str(audio_file),
            "-show_entries", "format=duration",
            "-v", "quiet", "-of", "csv=p=0"
        ]
        out = subprocess.check_output(probe_cmd).decode().strip()
        dur = float(out)
        durations[sid] = dur
        print(f"  ✓ {sid}: {dur:.2f} seconds")
    return durations

def reset_database():
    print("🔄 Resetting database to clean initial demo state...")
    try:
        import urllib.request
        req = urllib.request.Request("http://localhost:8080/api/demo/reset", method="POST")
        with urllib.request.urlopen(req) as response:
            pass
        print("  ✓ Database reset successfully.")
    except Exception as e:
        print(f"  ⚠️ Warning resetting db: {e}")

def record_browser_session(durations):
    from playwright.sync_api import sync_playwright

    video_record_dir = TEMP_DIR / "browser_video"
    video_record_dir.mkdir(parents=True, exist_ok=True)

    print("🎬 Starting Playwright browser automation with video recording...")
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
        # SCENE 1: Introduction & App Overview
        # ==========================================
        print("  ▶ Recording Scene 1: Introduction & Overview")
        page.goto("http://localhost:8080", wait_until="networkidle")
        time.sleep(2)
        
        # Slowly scroll down to reveal the 19 tools observability panel
        s1_dur = durations["scene1_intro"]
        start_time = time.time()
        
        # Hover over badges
        page.hover("text=Gemini 2.5 Flash")
        time.sleep(1.5)
        page.hover("text=Hyderabad Metro")
        time.sleep(1.5)
        
        # Scroll down to show Multi-Agent Observability
        page.evaluate("window.scrollTo({top: 500, behavior: 'smooth'})")
        time.sleep(3.0)
        page.evaluate("window.scrollTo({top: 0, behavior: 'smooth'})")
        
        remaining = s1_dur - (time.time() - start_time)
        if remaining > 0:
            time.sleep(remaining + 0.5)

        # ==========================================
        # SCENE 2: Donor View & Gemini Natural Language Intake
        # ==========================================
        print("  ▶ Recording Scene 2: Donor View & Gemini Extraction")
        start_time = time.time()
        s2_dur = durations["scene2_donor_intake"]
        
        # Click the Paradise Biryani sample pill
        page.click("text=Paradise Biryani (60 Hot Meals)")
        time.sleep(2.0)
        
        # Click "Extract Details with Gemini"
        page.click("text=Extract Details with Gemini")
        time.sleep(5.0)  # Wait for live Gemini 2.5 Flash extraction
        
        # Scroll down to highlight extracted structured card and FSSAI safety badge
        page.evaluate("window.scrollTo({top: 350, behavior: 'smooth'})")
        time.sleep(3.0)
        
        # Click "Submit Donation to FoodRescue Network"
        page.click("text=Submit Donation to FoodRescue Network")
        time.sleep(3.5)
        
        remaining = s2_dur - (time.time() - start_time)
        if remaining > 0:
            time.sleep(remaining + 0.5)

        # ==========================================
        # SCENE 3: NGO / Recipient Network Portal
        # ==========================================
        print("  ▶ Recording Scene 3: NGO Portal & Allocation Acceptance")
        start_time = time.time()
        s3_dur = durations["scene3_ngo_portal"]
        
        page.evaluate("window.scrollTo({top: 0, behavior: 'smooth'})")
        time.sleep(0.5)
        
        # Switch to NGO view
        page.click("button:has-text('NGO / Shelter')")
        time.sleep(3.0)
        
        # Look for incoming proposal and adjust partial quantity slider or click accept
        try:
            accept_btn = page.wait_for_selector("button:has-text('Accept')", timeout=5000)
            if accept_btn:
                time.sleep(2.0)
                accept_btn.click()
                time.sleep(2.5)
        except Exception as e:
            print(f"    Notice on NGO accept: {e}")
            time.sleep(2.0)
            
        remaining = s3_dur - (time.time() - start_time)
        if remaining > 0:
            time.sleep(remaining + 0.5)

        # ==========================================
        # SCENE 4: Volunteer Fleet Hub & Temperature Logging
        # ==========================================
        print("  ▶ Recording Scene 4: Volunteer Fleet Hub & Pickup")
        start_time = time.time()
        s4_dur = durations["scene4_volunteer_fleet"]
        
        page.evaluate("window.scrollTo({top: 0, behavior: 'smooth'})")
        time.sleep(0.5)
        
        # Switch to Volunteer view
        page.click("button:has-text('Volunteer')")
        time.sleep(3.0)
        
        # Select volunteer Snoor Jahan (who has capacity 150)
        try:
            page.select_option("select#volunteer-select", "vol-snoor")
            time.sleep(2.0)
        except Exception:
            pass
            
        # Accept pickup job if available
        try:
            accept_job_btn = page.query_selector("button:has-text('Accept Pickup Job')")
            if accept_job_btn:
                accept_job_btn.click()
                time.sleep(2.5)
        except Exception as e:
            print(f"    Notice on volunteer accept: {e}")

        # Record physical pickup temperature
        try:
            pickup_btn = page.query_selector("button:has-text('Confirm Pickup')")
            if pickup_btn:
                # Fill temp
                temp_input = page.query_selector("input#temp-input")
                if temp_input:
                    temp_input.fill("64")
                    time.sleep(1.0)
                pickup_btn.click()
                time.sleep(2.5)
        except Exception as e:
            print(f"    Notice on pickup confirm: {e}")

        remaining = s4_dur - (time.time() - start_time)
        if remaining > 0:
            time.sleep(remaining + 0.5)

        # ==========================================
        # SCENE 5: Coordinator Command Center & Observability
        # ==========================================
        print("  ▶ Recording Scene 5: Coordinator Command Center & RAG Rules")
        start_time = time.time()
        s5_dur = durations["scene5_coordinator_oversight"]
        
        page.evaluate("window.scrollTo({top: 0, behavior: 'smooth'})")
        time.sleep(0.5)
        
        # Switch to Coordinator view
        page.click("button:has-text('Coordinator')")
        time.sleep(3.0)
        
        # Click "View Regulatory Knowledge & RAG Rules"
        page.click("text=View Regulatory Knowledge & RAG Rules")
        time.sleep(4.0)
        
        # Close knowledge modal
        page.click("text=Close Knowledge Base")
        time.sleep(2.0)
        
        # Scroll down to show Agent Execution Traces
        page.evaluate("window.scrollTo({top: 600, behavior: 'smooth'})")
        time.sleep(3.0)
        
        remaining = s5_dur - (time.time() - start_time)
        if remaining > 0:
            time.sleep(remaining + 1.0)

        # Close page and context to finalize video recording
        page.close()
        context.close()
        browser.close()

    # Find the recorded webm file
    video_files = list(video_record_dir.glob("*.webm"))
    if not video_files:
        raise RuntimeError("No recorded webm video found in Playwright output directory!")
    raw_video = video_files[0]
    print(f"  ✓ Raw video recorded: {raw_video} ({raw_video.stat().st_size / 1024 / 1024:.2f} MB)")
    return raw_video

def assemble_final_video(raw_video_path, durations):
    print("🎛 Post-Production: Concatenating voiceovers and muxing into final MP4...")
    
    # 1. Create ffmpeg concat list for audio
    concat_txt = TEMP_DIR / "audio_concat.txt"
    with open(concat_txt, "w") as f:
        for scene in SCENES:
            sid = scene["id"]
            audio_file = TEMP_DIR / f"{sid}.mp3"
            f.write(f"file '{audio_file}'\n")

    combined_audio = TEMP_DIR / "full_narration.mp3"
    subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", str(concat_txt),
        "-c", "copy", str(combined_audio)
    ], check=True)
    
    # Measure audio duration
    probe_cmd = [
        "ffprobe", "-i", str(combined_audio),
        "-show_entries", "format=duration",
        "-v", "quiet", "-of", "csv=p=0"
    ]
    total_audio_dur = float(subprocess.check_output(probe_cmd).decode().strip())
    print(f"  ✓ Combined voiceover duration: {total_audio_dur:.2f} seconds")

    # 2. Output MP4 file paths
    final_mp4 = OUTPUT_DIR / "foodrescue_ai_demo.mp4"
    desktop_mp4 = Path("/config/Desktop/FoodRescue_AI_Demo.mp4")

    # Mux video and audio together, trimming/padding to exact match
    # Re-encode to H.264 high profile with AAC audio for universal web compatibility
    print("  🎞 Encoding final video with H.264 / AAC...")
    ffmpeg_cmd = [
        "ffmpeg", "-y",
        "-i", str(raw_video_path),
        "-i", str(combined_audio),
        "-filter_complex", (
            f"[0:v]setpts=PTS-STARTPTS,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,format=yuv420p[v];"
            f"[1:a]afade=t=in:ss=0:d=0.5,afade=t=out:st={total_audio_dur - 0.8}:d=0.8[a]"
        ),
        "-map", "[v]",
        "-map", "[a]",
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "20",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        str(final_mp4)
    ]
    subprocess.run(ffmpeg_cmd, check=True)
    
    # Copy to Desktop for immediate user access
    import shutil
    shutil.copy2(final_mp4, desktop_mp4)
    
    print("\n========================================================")
    print(f"🎉 DEMO VIDEO SUCCESSFULLY PRODUCED!")
    print(f"📁 Public Path:  {final_mp4}")
    print(f"🖥 Desktop Path: {desktop_mp4}")
    print(f"📊 Video Size:   {final_mp4.stat().st_size / 1024 / 1024:.2f} MB")
    print("========================================================")
    return final_mp4

def main():
    durations = generate_voiceovers()
    reset_database()
    raw_video = record_browser_session(durations)
    assemble_final_video(raw_video, durations)

if __name__ == "__main__":
    main()
