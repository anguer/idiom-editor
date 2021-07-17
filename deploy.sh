#!/usr/bin/env sh

# 发生任何错误时终止
set -e

# 构建
npm run build

# 进入输出产物文件夹
cd dist

# 如果你要部署到自定义域名
# echo 'www.example.com' > CNAME

# 创建.nojekyll 防止Github Pages build错误
touch .nojekyll

git init
git add -A
git commit -m 'deploy'

# 如果你要部署在 https://<USERNAME>.github.io/<REPO>
 git push -f git@github.com:anguer/idiom-editor.git master:gh-pages

cd -
