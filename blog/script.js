document.addEventListener("DOMContentLoaded", (event) => {
  document.querySelectorAll("pre").forEach((el) => {
    const html = el.innerHTML.trimEnd();
    el.innerHTML = hljs.highlightAuto(html).value;
  });
});
