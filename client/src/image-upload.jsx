const ImageUpload = ({ handleFiles }) => {
  return (
    <input
      type="file"
      className="form-control border-0"
      multiple
      onChange={(e) => handleFiles(e.target.files)}
    />
  );
};

export default ImageUpload;
