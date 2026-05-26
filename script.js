const copyButton = document.querySelector("[data-copy-target='bibtex']");
const bibtex = document.querySelector("#bibtex code");

if (copyButton && bibtex) {
  copyButton.addEventListener("click", async () => {
    const originalText = copyButton.textContent;

    try {
      await navigator.clipboard.writeText(bibtex.textContent.trim());
      copyButton.textContent = "Copied";
    } catch {
      copyButton.textContent = "Copy manually";
    }

    window.setTimeout(() => {
      copyButton.textContent = originalText;
    }, 1800);
  });
}
