import os
import json
import shutil
import time
from datetime import datetime

history_dir = r"C:\Users\admin\AppData\Roaming\Code\User\History"
project_path_marker = "smart-green-market/frontend/web-site/src/components/dealer"
project_path_marker2 = "smart-green-market/frontend/web-site/src/pages/dealer"
recovery_dir = r"D:\DoAnTotNghiep\smart-green-market\frontend\web-site\recovery_dealer"

if not os.path.exists(recovery_dir):
    os.makedirs(recovery_dir)

for root, dirs, files in os.walk(history_dir):
    if "entries.json" in files:
        entries_path = os.path.join(root, "entries.json")
        try:
            with open(entries_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            resource = data.get("resource", "").lower()
            
            # Check if it belongs to dealer module
            if project_path_marker in resource or project_path_marker2 in resource:
                # Extract filename and relative path
                # resource looks like file:///d%3a/doantotnghiep/smart-green-market/frontend/web-site/src/pages/dealer/inventory.jsx
                import urllib.parse
                decoded_resource = urllib.parse.unquote(resource)
                filename = decoded_resource.split("/")[-1]
                
                entries = data.get("entries", [])
                if not entries:
                    continue
                
                # Sort entries by timestamp desc
                entries.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
                
                # Take top 5 recent entries
                for i, entry in enumerate(entries[:5]):
                    entry_id = entry.get("id")
                    timestamp = entry.get("timestamp", 0) / 1000.0
                    dt = datetime.fromtimestamp(timestamp)
                    
                    src_file = os.path.join(root, entry_id)
                    if os.path.exists(src_file):
                        # Create folder for this file
                        file_recover_dir = os.path.join(recovery_dir, filename)
                        if not os.path.exists(file_recover_dir):
                            os.makedirs(file_recover_dir)
                            
                        dest_name = f"{dt.strftime('%Y%m%d_%H%M%S')}_{filename}"
                        dest_file = os.path.join(file_recover_dir, dest_name)
                        shutil.copy2(src_file, dest_file)
                        print(f"Recovered {filename} -> {dest_name}")
                        
        except Exception as e:
            print(f"Error processing {entries_path}: {e}")

print("Recovery extraction complete. Check the 'recovery_dealer' folder.")
