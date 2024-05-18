$(document).ready(async function () {
  $(".progress-bar").show();
  console.log("Loading model...");
  model = await tf.loadLayersModel("model/model.json");
  console.log("Model loaded.");
  $(".progress-bar").hide();
});

$("#image-selector").change(function () {
  $("#image-prediction-container").empty(); // Clear previous images and predictions

  let files = $("#image-selector").prop("files");
  Array.from(files).forEach((file) => {
    let reader = new FileReader();
    reader.onload = function () {
      let dataURL = reader.result;

      let imgElement = $(`<div class="col-4">
                                    <img src="${dataURL}" class="selected-image" width="250" alt="">
                                    <ol class="prediction-list"></ol>
                                </div>`);
      $("#image-prediction-container").append(imgElement);
    };
    reader.readAsDataURL(file);
  });
});

$("#predict-button").click(async function () {
  $(".selected-image").each(async function () {
    let image = $(this).get(0);

    // Pre-process the image
    let tensor = tf.browser
      .fromPixels(image)
      .resizeNearestNeighbor([96, 96]) // Change the image size here
      .toFloat()
      .div(tf.scalar(255.0))
      .expandDims();

    let predictions = await model.predict(tensor).data();
    let top5 = Array.from(predictions)
      .map((p, i) => {
        return {
          probability: p,
          className: TARGET_CLASSES[i], // We are selecting the value from the obj
        };
      })
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 2);

    let predictionList = $(this).next(".prediction-list");
    predictionList.empty();
    top5.forEach((p) => {
      predictionList.append(
        `<li>${p.className}: ${p.probability.toFixed(6)}</li>`
      );
    });
  });
});
