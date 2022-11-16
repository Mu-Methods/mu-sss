"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    name: 'my-plugin',
    version: '0.0.1',
    manifest: {
        helloWorld: 'sync'
    },
    init: () => {
        return {
            helloWorld: () => console.log('Hello World')
        };
    },
};
