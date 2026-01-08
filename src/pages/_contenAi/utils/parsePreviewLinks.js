/**
 * Parses content text and extracts preview links
 * @param {string} content - The raw content text
 * @returns {Object} - { segments: Array<{type: 'text' | 'preview_link', content: string}> }
 */
export function parsePreviewLinks(content) {
    if (!content || typeof content !== 'string') {
        return { segments: [{ type: 'text', content: content || '' }] };
    }

    const regex = /<preview_link>\s*([\s\S]*?)\s*<\/preview_link>/gi;
    const segments = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
            const textBefore = content.slice(lastIndex, match.index).trim();
            if (textBefore) {
                segments.push({ type: 'text', content: textBefore });
            }
        }

        // Add the preview link
        const url = match[1].trim();
        if (url) {
            segments.push({ type: 'preview_link', content: url });
        }

        lastIndex = regex.lastIndex;
    }

    // Add remaining text after last match
    if (lastIndex < content.length) {
        const remainingText = content.slice(lastIndex).trim();
        if (remainingText) {
            segments.push({ type: 'text', content: remainingText });
        }
    }

    // If no matches found, return original content as text
    if (segments.length === 0) {
        return { segments: [{ type: 'text', content }] };
    }

    return { segments };
}
