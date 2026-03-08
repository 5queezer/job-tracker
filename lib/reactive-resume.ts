const RR_API_URL = process.env.RR_API_URL || "";
const RR_API_KEY = process.env.RR_API_KEY || "";
const RR_BASE_RESUME_ID = process.env.RR_BASE_RESUME_ID || "";

function headers(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-api-key": RR_API_KEY,
  };
}

export function isConfigured(): boolean {
  return !!(RR_API_URL && RR_API_KEY && RR_BASE_RESUME_ID);
}

export function getResumeEditUrl(resumeId: string): string {
  // RR_API_URL is like "https://resume.vasudev.xyz/api/openapi"
  // The edit URL is "https://resume.vasudev.xyz/dashboard/resumes/{id}"
  const base = RR_API_URL.replace(/\/api\/openapi\/?$/, "");
  return `${base}/dashboard/resumes/${resumeId}`;
}

export async function duplicateResume(name: string): Promise<string> {
  const res = await fetch(`${RR_API_URL}/resumes/${RR_BASE_RESUME_ID}/duplicate`, {
    method: "POST",
    headers: headers(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to duplicate resume: ${res.status} ${text}`);
  }
  const newId: string = await res.json();

  // Update the name via patch (set basics.headline or use the title)
  // The PATCH endpoint operates on resume data, so we update the summary title
  // to include the company/role for easy identification.
  // Note: The resume "name" is a top-level field not accessible via data PATCH.
  // We'll update the headline in basics instead.
  await fetch(`${RR_API_URL}/resumes/${newId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({
      id: newId,
      operations: [
        { op: "replace", path: "/basics/headline", value: name },
      ],
    }),
  });

  return newId;
}

export async function getResume(resumeId: string): Promise<unknown> {
  const res = await fetch(`${RR_API_URL}/resumes/${resumeId}`, {
    method: "GET",
    headers: headers(),
  });
  if (!res.ok) return null;
  return res.json();
}
