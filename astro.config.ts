import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwind from '@astrojs/tailwind';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { server as wisp } from '@mercuryworkshop/wisp-js/server';
import { baremuxPath } from '@mercuryworkshop/bare-mux/node';
import { epoxyPath } from '@mercuryworkshop/epoxy-transport';
import { version } from './package.json';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import playformCompress from '@playform/compress';
import { normalizePath } from 'vite';

function LU() {
  const gitPath = path.join(process.cwd(), '.git');
  if (fs.existsSync(gitPath)) {
    try {
      const commitDate = execSync('git log -1 --format=%cd --date=iso')
        .toString()
        .trim();
      return new Date(commitDate).toISOString();
    } catch {
      return new Date().toISOString();
    }
  }
  return new Date().toISOString();
}

export default defineConfig({
  output: 'static',
  adapter: node({ mode: 'middleware' }),
  integrations: [
    tailwind(),
    playformCompress({
      CSS: false,
      HTML: true,
      Image: true,
      JavaScript: true,
      SVG: true,
    }),
  ],
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'viewport',
  },
  vite: {
    define: {
      VERSION: JSON.stringify(version),
      LAST_UPDATED: JSON.stringify(LU()),
    },
    plugins: [
      {
        name: 'viteserver',
        configureServer(server) {
          server.httpServer?.on('upgrade', (req, socket, head) => {
            if (req.url?.startsWith('/wsp')) {
              wisp.routeRequest(req, socket, head);
            }
          });
        },
      },
      viteStaticCopy({
        targets: [
          {
            src: normalizePath(epoxyPath + '/**/*.mjs'),
            dest: 'ep',
            overwrite: false,
          },
          {
            src: normalizePath(baremuxPath + '/**/*.js'),
            dest: 'bm',
            overwrite: false,
          },
        ],
      }),
    ],
  },
});
