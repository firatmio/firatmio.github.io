/**
 * A contact's mark as the closing sky's stars draw it: square SVG paths painted in order,
 * each in one of the platform's own colours (sRGB hex) — so a later layer covers an
 * earlier one, and `stroke` draws a path as a line of that width instead of filling it.
 */
export interface ContactMark {
  viewBox: number;
  layers: { d: string; color: string; stroke?: number }[];
}

export interface ContactLink {
  id: string;
  label: string;
  handle: string;
  href: string;
  mark: ContactMark;
}

// Brand marks from Simple Icons 16.31.0 (CC0), in their colours for dark backgrounds.
const LINKEDIN =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z";
/** The LinkedIn mark's rounded square alone (its path's last contour): white behind the blue, so "in" shows white. */
const LINKEDIN_SQUARE =
  "M22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z";
const X =
  "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z";
const GITHUB =
  "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12";
/** An envelope, in the site's own ember — email has no platform colour. */
const ENVELOPE = "M4.5 5h15A2.5 2.5 0 0 1 22 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 16.5v-9A2.5 2.5 0 0 1 4.5 5zM2.6 7.2l9.4 6.3 9.4-6.3";

/** The contacts of the closing sky, in the order of DESERT.contacts: logos top left, top right, bottom left, bottom right. */
export const contacts: ContactLink[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    handle: "/in/firattunaarslan",
    href: "https://www.linkedin.com/in/firattunaarslan",
    mark: {
      viewBox: 24,
      layers: [
        { d: LINKEDIN_SQUARE, color: "#FFFFFF" },
        { d: LINKEDIN, color: "#0A66C2" },
      ],
    },
  },
  {
    id: "x",
    label: "X",
    handle: "@firattunaarslan",
    href: "https://x.com/firattunaarslan",
    mark: { viewBox: 24, layers: [{ d: X, color: "#FFFFFF" }] },
  },
  {
    id: "github",
    label: "GitHub",
    handle: "@firatmio",
    href: "https://github.com/firatmio",
    mark: { viewBox: 24, layers: [{ d: GITHUB, color: "#FFFFFF" }] },
  },
  {
    id: "email",
    label: "Email",
    handle: "me@firattunaarslan.me",
    href: "mailto:me@firattunaarslan.me",
    mark: { viewBox: 24, layers: [{ d: ENVELOPE, color: "#FFB27A", stroke: 1.8 }] },
  },
];
