import os
import sys

def add_postfix_to_files(folder_path, postfix):
    # Check if the provided folder exists
    if not os.path.isdir(folder_path):
        print(f"The folder {folder_path} does not exist.")
        return

    # Iterate over each file in the folder
    for filename in os.listdir(folder_path):
        # Construct the full file path
        old_file_path = os.path.join(folder_path, filename)

        # Check if it's a file
        if os.path.isfile(old_file_path):
            # Split the filename into name and extension
            name, ext = os.path.splitext(filename)
            # Construct the new file name with postfix
            new_filename = f"{name}{postfix}{ext}"
            # Construct the full new file path
            new_file_path = os.path.join(folder_path, new_filename)

            # Rename the file
            os.rename(old_file_path, new_file_path)
            print(f"Renamed: {old_file_path} -> {new_file_path}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python add_postfix.py <folder_path> <postfix>")
    else:
        folder_path = sys.argv[1]
        postfix = sys.argv[2]
        add_postfix_to_files(folder_path, postfix)

# usage in terminal:
# python index.py ./train/dogs _1