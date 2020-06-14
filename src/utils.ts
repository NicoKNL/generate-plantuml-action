import fs from 'fs';
import { uniq } from 'lodash';
import path from 'path';
const markdownit = require('markdown-it');

export function retrieveCodes(files) {
    return files.reduce((accum, f) => {
        const p = path.parse(f);
        console.log(p.ext);
/**
        if (p.ext === '.pu') {
            return accum.concat({
                name: p.name,
                // TODO: files may have been deleted.
                code: fs.readFileSync(f).toString(),
            });
        }
        if (p.ext === '.md') {
            // TODO: files may have been deleted.
            const content = fs.readFileSync(f).toString();
            return accum.concat(puFromMd(content));
        }
*/
        switch( p.ext ) { 
        case '.pu': 
        case '.puml':
        case '.plantuml': 
        case '.iuml': 
            return accum.concat({
                name: p.name,
                // TODO: files may have been deleted.
                code: fs.readFileSync(f).toString(),
            });
          break; 

        case '.md':
            // TODO: files may have been deleted.
            const content = fs.readFileSync(f).toString();
            return accum.concat(puFromMd(content));
          break; 

        default: { 
          //statements; 
          break; 
        } 
    } 

        return p.ext === '.md' ? accum.concat(f) : accum
    }, []);
}

const infoRegexp = /^plantuml(?:@(.+))?:([\w-_.]+)/;

function puFromMd(markdown) {
    const md = new markdownit();
    const fences = md.parse(markdown, {})
        .filter(token => token.type === 'fence')
        .filter(token => infoRegexp.test(token.info));

    return fences.reduce((accum, fence) => {
        const [, umlType, name] = fence.info.match(infoRegexp) || [];
        const [, typeInContent] = fence.content.match(/^(@start\w+)/) || [];

        if (!name) {
            return accum;
        }
        if (typeInContent) {
            return accum.concat({
                name,
                code: fence.content
            })
        }
        const t = umlType || 'uml';
        return accum.concat({
            name,
            code: [
                `@start${t}`,
                fence.content.trim(),
                `@end${t}`,
                ''
            ].join("\n"),
        })
    }, []);
}

export async function getCommitsFromPayload(octokit, payload) {
    const commits = payload.commits;
    const owner   = payload.repository.owner.login;
    const repo    = payload.repository.name;

    const res = await Promise.all(commits.map(commit => octokit.repos.getCommit({
        owner, repo, ref: commit.id
    })));
    return res.map(res => (<any>res).data);
}

export function updatedFiles(commits) {
    return uniq(commits.reduce(
        (accum: any[], commit) => accum.concat(commit.files.map(f => f.filename)),
        []
    ));
}
