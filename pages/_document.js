import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Google Translate Widget */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              function googleTranslateElementInit() {
                new google.translate.TranslateElement({
                  pageLanguage: 'en',
                  includedLanguages: 'kn,hi,te,ta,ml,mr,pa,bn,gu,en',
                  layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                  autoDisplay: false
                }, 'google_translate_element');
              }
            `
          }}
        />
        <script src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" />
        <style dangerouslySetInnerHTML={{__html: `
          #google_translate_element {
            position: fixed;
            top: 12px;
            right: 16px;
            z-index: 99999;
            background: white;
            border-radius: 8px;
            padding: 4px 8px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.12);
            border: 1px solid #e2e8f0;
          }
          .goog-te-banner-frame { display: none !important; }
          body { top: 0 !important; }
          .goog-te-gadget-simple {
            font-size: 13px !important;
            border: none !important;
            background: transparent !important;
          }
        `}} />
      </Head>
      <body>
        <div id="google_translate_element" />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
