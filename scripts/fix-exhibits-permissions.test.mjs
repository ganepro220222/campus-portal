#!/usr/bin/env node
/** fix-exhibits-permissions.sh 静态结构门禁（不含 Docker 集成） */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const shPath = path.join(dir, 'fix-exhibits-permissions.sh')
const sh = fs.readFileSync(shPath, 'utf8')

assert.doesNotMatch(sh, /STAGING_INSECURE/, 'must not offer world-writable mode')
assert.doesNotMatch(sh, /chgrp -R "\$GID" "\$EX"/, 'must not chgrp entire exhibits tree')
assert.doesNotMatch(sh, /repair_content_other_read/, 'dead repair helper removed')
assert.doesNotMatch(sh, /if ! as_studio[\s\S]{0,160}rc=\$\?/, 'must not capture rc after if ! as_studio')
assert.doesNotMatch(sh, /setfacl[^\n]*\|\| true/, 'setfacl must fail closed when SET_CONTENT_ACL enabled')
assert.match(sh, /EXHIBITS_GROUP 不能为 0/)
assert.match(sh, /harden_code_tree/)
assert.match(sh, /apply_content_tree/)
assert.match(sh, /remove_nginx_from_write_group/)
assert.match(sh, /add_user_to_write_group/)
assert.match(sh, /FILEBROWSER_USER/)
assert.match(sh, /gpasswd -d|deluser/)
assert.match(sh, /chmod 2775/)
assert.match(sh, /chmod 3775 "\$EX"/)
assert.doesNotMatch(sh, /chmod 755 "\$EX"/)
assert.doesNotMatch(sh, /chown root:root "\$EX"/)
assert.match(sh, /verify_content_delete_gate/)
assert.match(sh, /FILEBROWSER_UID/)
assert.match(sh, /CONTENT_OWNER_UID/)
assert.match(sh, /craft-\*/)
assert.match(sh, /shuyuan-exhibits/)
assert.match(sh, /SET_CONTENT_ACL:-1/)
assert.match(sh, /setfacl -R -d -m "u:\$\{NGX\}:rX"/)
assert.match(sh, /setfacl -d -m "u:\$\{NGX\}:rX" "\$EX"/)
assert.match(sh, /as_studio_available/)
assert.match(sh, /verify_studio_gate/)
assert.match(sh, /verify_studio_process_groups/)
assert.match(sh, /as_studio/)
assert.match(sh, /缺少 runuser 或 sudo/)

console.log('fix-exhibits-permissions.test: PASS')
