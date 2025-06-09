import {html} from "npm:htl";

export function Trend(
  value,
  {
    positive = "blue",
    negative = "brown",
    base = "muted",
    positiveSuffix = " Increase ↑",
    negativeSuffix = " Decrease ↓",
    baseSuffix = ""
  } = {}
) {
  const variant = value > 0 ? positive : value < 0 ? negative : base;
  const suffix = value > 0 ? positiveSuffix : value < 0 ? negativeSuffix : baseSuffix;
  return html`<span class="${variant}"">${suffix}</span>`;
}
