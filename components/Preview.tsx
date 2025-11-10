import React, { useMemo } from 'react';

interface PreviewProps {
    html: string;
    css: string;
    js: string;
}

export const Preview: React.FC<PreviewProps> = ({ html, css, js }) => {
    const srcDoc = useMemo(() => {
        return `
            <html>
                <body>${html}</body>
                <style>${css}</style>
                <script>${js}</script>
            </html>
        `;
    }, [html, css, js]);
    
    return (
        <div className="w-full h-full bg-white">
            <iframe
                srcDoc={srcDoc}
                title="preview"
                sandbox="allow-scripts"
                frameBorder="0"
                width="100%"
                height="100%"
            />
        </div>
    );
};
