# 50플러스 AI 교실 · GitHub Pages

주차 선택 첫 화면과 1주차 강의안입니다.

- 1주차: 프롬프트 작성법과 웹 개발 기초 (열림)
- 2·3·4주차: 준비 중 (잠금 표시, 이동 안 됨)
- 1주차 왼쪽 위의 “주차 선택”으로 첫 화면에 돌아옵니다.

## 바로 확인하기

압축을 풀고 index.html을 브라우저로 여세요. HTML 두 파일과 assets 폴더를 함께 두어야 합니다. 인터넷 연결 없이도 강의 내용을 볼 수 있습니다.

## GitHub Pages 게시

1. GitHub 저장소의 게시할 브랜치(예: main)에 압축 안의 파일과 assets 폴더를 올립니다. index.html이 저장소 최상위에 오도록 합니다. ZIP 자체를 올리는 것이 아니라 압축을 풀어 안의 파일을 올립니다.
2. 저장소 Settings → Pages를 엽니다.
3. Build and deployment의 Source에서 Deploy from a branch를 선택합니다.
4. 올린 브랜치와 /(root)를 선택하고 Save를 누릅니다.
5. GitHub가 제공하는 Pages 주소에서 확인합니다.

공식 안내: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## 나중에 주차를 열 때

해당 강의 HTML을 같은 폴더에 추가하고 index.html의 해당 주차 button을 1주차와 같은 a 링크 형태로 바꿉니다. disabled와 locked를 제거하고 open 클래스를 붙인 뒤 수강 가능 문구와 상대경로 href를 넣습니다.

## 파일

- index.html: 주차 선택
- 50plus_AI_Week1.html: 1주차 강의
- assets/: 공통 글꼴
- .nojekyll: 정적 파일 게시 설정

1주차는 원본 인포그래픽 6개와 단계별 설명, 프롬프트 실습 기능을 포함합니다.
