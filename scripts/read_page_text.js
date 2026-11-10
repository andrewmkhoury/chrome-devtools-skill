() => {
  // Readable text of the page, including content rendered inside shadow roots
  // (Backstage idocs / MkDocs, where document.body.innerText comes back ~empty).
  // Returns the largest "main content" region found across light DOM + every
  // open shadow root; falls back to document.body.innerText.
  const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);
  const roots = [document];
  const collect = (root) => {
    root.querySelectorAll("*").forEach((el) => {
      if (el.shadowRoot) { roots.push(el.shadowRoot); collect(el.shadowRoot); }
    });
  };
  collect(document);
  const SELS = ['article.md-content', '[role="main"] article', '[role="main"]',
                '.md-content article', '.md-content', 'main article', 'article', 'main'];
  const clean = (s) => (s || "").replace(/\s*\n\s*\n\s*\n+/g, "\n\n").trim();
  let best = "";
  for (const scope of roots) {
    for (const sel of SELS) {
      let els; try { els = scope.querySelectorAll(sel); } catch (e) { continue; }
      for (const el of els) {
        if (SKIP.has(el.tagName)) continue;
        const t = clean(el.innerText);
        if (t.length > best.length) best = t;
      }
    }
  }
  if (!best) best = clean(document.body.innerText);
  return best;
}
