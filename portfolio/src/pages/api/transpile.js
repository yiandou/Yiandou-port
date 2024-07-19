const { exec } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const babel = require('@babel/core');
const js2py = require('js2py');
export default async function transpile(req, res) {
    const supportedLang = []
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed, please use the POST method on this endpoint' });
    }
    const { sourceCode, fromLanguage, toLanguage } = req.body;
    if (!sourceCode || !fromLanguage || !toLanguage) {
        return res.status(400).json({
            message: `Missing required parameter(s): ${!sourceCode ? 'sourceCode' : ''}${!fromLanguage ? ', fromLanguage' : ''}${!toLanguage ? ', toLanguage' : ''}
            Supported languages are: ${supportedLang.join(', ')}`
        });
    }
    const inputFile = path.join(process.cwd(), 'temp', 'input.' + fromLanguage);
    await fs.writeFileSync(inputFile, sourceCode);
    switch (fromLanguage) {
        case 'js':
            switch (toLanguage) {
                case 'py':
                    const { code } = babel.transformFileSync(inputFile, {
                        presets: ['@babel/preset-env']
                    });
                    const pyCode = js2py.eval_js(code);
                    await fs.unlinkSync(inputFile);
                    return res.status(200).json({ message: 'Transpilation successful', transpiledCode: pyCode });
                default:
                    return res.status(400).json({ message: `Unsupported language: ${toLanguage}` });
            }
        default:
            return res.status(400).json({ message: `Unsupported language: ${fromLanguage}` });
    }
}