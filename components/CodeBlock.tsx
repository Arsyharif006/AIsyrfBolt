import React, { useState } from 'react';
import { useLocalization } from '../contexts/LocalizationContext';
import { Preview } from './Preview';
import {
  FiCode,
  FiEye,
  FiChevronDown,
  FiChevronUp,
  FiMaximize2,
  FiMinimize2,
  FiCopy,
  FiCheck
} from 'react-icons/fi';

interface CodeBlockProps {
  language: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<'code' | 'preview'>('code');
  const [previewMode, setPreviewMode] = useState<'normal' | 'minimized' | 'fullscreen'>('normal');
  const { t } = useLocalization();

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  const isPreviewable = language.toLowerCase() === 'html';
  const isFullScreen = previewMode === 'fullscreen';
  const isMinimized = previewMode === 'minimized';

  const toggleMinimize = () => {
    setPreviewMode(prev => prev === 'minimized' ? 'normal' : 'minimized');
  };

  const toggleFullScreen = () => {
    setPreviewMode(prev => prev === 'fullscreen' ? 'normal' : 'fullscreen');
  };

  const fullScreenClasses = isFullScreen ? 'fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-sm p-4 flex flex-col' : '';

  return (
    <div className={`bg-gray-900 rounded-lg my-2 text-sm border border-gray-700/50 ${fullScreenClasses}`}>
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/50 rounded-t-lg flex-shrink-0">
        <div className="flex items-center gap-4">
            <span className="text-gray-400 capitalize">{language || 'code'}</span>
            {isPreviewable && (
                <div className="flex items-center text-xs text-gray-400 rounded-md p-0.5 bg-gray-700">
                    <button 
                      onClick={() => setView('code')} 
                      title="Code" 
                      className={`p-1 rounded-sm transition-colors ${view === 'code' ? 'bg-gray-600 text-white' : 'hover:bg-gray-600/50'}`}
                    >
                      <FiCode  />
                    </button>
                    <button 
                      onClick={() => setView('preview')} 
                      title="Preview" 
                      className={`p-1 rounded-sm transition-colors ${view === 'preview' ? 'bg-gray-600 text-white' : 'hover:bg-gray-600/50'}`}
                    >
                      <FiEye  />
                    </button>
                </div>
            )}
        </div>

        <div className="flex items-center gap-2">
            {isPreviewable && view === 'preview' && (
              <div className="flex items-center gap-1 border-r border-gray-700 pr-2 mr-1">
                <button 
                  onClick={toggleMinimize} 
                  title={isMinimized ? 'Restore' : 'Minimize'} 
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
                >
                    {isMinimized ? <FiChevronUp  /> : <FiChevronDown  />}
                </button>
                <button 
                  onClick={toggleFullScreen} 
                  title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'} 
                  className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
                >
                    {isFullScreen ? <FiMinimize2  /> : <FiMaximize2  />}
                </button>
              </div>
            )}

            <button 
              onClick={handleCopy} 
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs" 
              aria-label={t('copy')}
            >
              {copied ? (
                <>
                  <FiCheck aria-hidden />
                  {t('copied')}
                </>
              ) : (
                <>
                  <FiCopy  aria-hidden />
                  {t('copy')}
                </>
              )}
            </button>
        </div>
      </div>

      {(view === 'code' || !isPreviewable) ? (
        <pre className={`overflow-x-auto p-4 bg-gray-900/50 rounded-b-lg ${isFullScreen ? 'flex-grow' : ''}`}>
            <code className="text-white">{code}</code>
        </pre>
      ) : (
        <div className={`w-full resize-y overflow-auto rounded-b-lg ${isMinimized ? 'hidden' : ''} ${isFullScreen ? 'flex-grow' : 'h-64'}`}>
            <Preview html={code} css="" js="" />
        </div>
      )}
    </div>
  );
};
