// Hide the static intro loader for visitors who already saw it this session.
(function () {
  try {
    if (sessionStorage.getItem("pq:loaderSeen") === "1") {
      document.getElementById("pq-static-loader").style.display = "none";
    }
  } catch (e) {}
})();
