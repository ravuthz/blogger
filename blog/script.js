// document.addEventListener("DOMContentLoaded", (event) => {
//   document.querySelectorAll("pre").forEach((el) => {
//     const html = el.innerHTML.trimEnd();
//     el.innerHTML = hljs.highlightAuto(html).value;
//   });
// });

document.addEventListener("DOMContentLoaded", (event) => {

  const $markdown = document.getElementById("markdown");
  if ($markdown) {
    document.getElementById('content').innerHTML = marked.parse($markdown.innerHTML);
  }
  
  const $codes = document.querySelectorAll("pre code");
  if ($codes) {
    $codes.forEach((element) => {
      const html = element.innerHTML.trimEnd();
      element.innerHTML = hljs.highlightAuto(html).value;
    });
  }
  
});
