import qp from "quoted-printable";
import TurndownService from "turndown";

/**
 * Universal email body decoder → Markdown
 * Handles MIME, base64, quoted-printable, plain, HTML.
 *
 * @param {string} raw - raw email string
 * @returns {string} markdown
 */
export function emailToMarkdown(raw) {
    try {
        // 🔹 First, try to parse as MIME email
        const parsedText = parseMIME(raw);
        if (parsedText) {
            return parsedText;
        }
    } catch (mimeError) {
        console.warn("MIME parsing failed, falling back to manual decoding:", mimeError);
    }

    // 🔹 Fallback: manual decoding
    let decoded = raw;

    try {
        // Try base64 if it looks like base64 (mostly safe chars + padding)
        const base64Pattern = /^[A-Za-z0-9+/=\r\n]+$/;
        if (base64Pattern.test(raw) && raw.length % 4 === 0) {
            const base64Decoded = atob(raw.replace(/\r?\n/g, ''));
            // Sanity check: contains readable text
            if (/[a-zA-Z0-9]/.test(base64Decoded)) {
                decoded = base64Decoded;
            }
        }

        // If looks like quoted-printable (=XX codes or soft breaks)
        if (/=[0-9A-F]{2}/i.test(decoded) || /=\r\n/.test(decoded)) {
            decoded = qp.decode(decoded);
        }
    } catch (decodeError) {
        console.error("Decode error:", decodeError);
        decoded = raw;
    }

    // Normalize newlines
    decoded = decoded.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").trim();

    // Detect if HTML
    const looksLikeHTML = /<\/?[a-z][\s\S]*>/i.test(decoded);

    if (looksLikeHTML) {
        const td = new TurndownService({
            headingStyle: "atx",
            codeBlockStyle: "fenced",
            linkStyle: "inlined",
            bulletListMarker: "-",
        });
        return td.turndown(decoded).trim();
    }

    // Otherwise, treat as plain text → paragraphs in Markdown
    return decoded
        .split("\n\n")
        .map(p => p.trim())
        .filter(Boolean)
        .join("\n\n");
}

/**
 * Simple MIME parser for browser
 */
function parseMIME(raw) {
    const lines = raw.split('\n');
    let headers = {};
    let body = '';
    let inBody = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!inBody) {
            if (line.trim() === '') {
                inBody = true;
                body = lines.slice(i + 1).join('\n');
                break;
            } else if (line.includes(':')) {
                const [key, ...value] = line.split(':');
                headers[key.trim().toLowerCase()] = value.join(':').trim();
            }
        }
    }

    if (!body) return null;

    const contentType = headers['content-type'] || '';
    if (contentType.includes('multipart/')) {
        const boundaryMatch = contentType.match(/boundary="([^"]+)"/) || contentType.match(/boundary=([^;\s]+)/);
        if (boundaryMatch) {
            const boundary = boundaryMatch[1];
            return parseMultipart(body, boundary);
        }
    }

    // Single part
    return decodePart(body, headers);
}

function parseMultipart(body, boundary) {
    const parts = body.split(`--${boundary}`);
    let textParts = [];

    for (const part of parts) {
        if (part.trim() && !part.includes('--')) {
            const decoded = decodePart(part.trim(), {});
            if (decoded) textParts.push(decoded);
        }
    }

    return textParts.join('\n\n');
}

function decodePart(part, headers) {
    const lines = part.split('\n');
    let partHeaders = {};
    let content = '';
    let inContent = false;

    for (const line of lines) {
        if (!inContent) {
            if (line.trim() === '') {
                inContent = true;
            } else if (line.includes(':')) {
                const [key, ...value] = line.split(':');
                partHeaders[key.trim().toLowerCase()] = value.join(':').trim();
            }
        } else {
            content += line + '\n';
        }
    }

    content = content.trim();

    const encoding = partHeaders['content-transfer-encoding'] || headers['content-transfer-encoding'] || '7bit';

    if (encoding === 'base64') {
        try {
            content = atob(content.replace(/\r?\n/g, ''));
        } catch (e) {
            console.warn('Base64 decode failed:', e);
        }
    } else if (encoding === 'quoted-printable') {
        content = qp.decode(content);
    }

    const contentType = partHeaders['content-type'] || headers['content-type'] || 'text/plain';

    if (contentType.includes('text/html')) {
        const td = new TurndownService({
            headingStyle: "atx",
            codeBlockStyle: "fenced",
            linkStyle: "inlined",
            bulletListMarker: "-",
        });
        return td.turndown(content).trim();
    } else if (contentType.includes('text/plain')) {
        return content;
    }

    return null;
}
