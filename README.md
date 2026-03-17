# watermark-app

한국어와 영어로 사용할 수 있는 이미지 텍스트 워터마크 웹앱입니다.  
A web app for adding text watermarks to images, with Korean-friendly rendering and Docker support.

---

## 한국어

### 소개
이미지를 업로드하거나 붙여넣은 뒤, 텍스트 워터마크를 적용하고 PNG로 다운로드할 수 있는 웹앱입니다.

### 주요 기능
- 이미지 업로드 / 드래그 앤 드롭 / 붙여넣기 지원
- 워터마크 문구 입력
- 배치 위치 선택
  - 좌측 상단
  - 우측 상단
  - 좌측 하단
  - 우측 하단
  - 대각선 1회
  - 대각선 반복
- 투명도 / 여백 / 글자 크기 / 글자 색상 조절
- 결과 미리보기
- PNG 다운로드
- 한글 폰트 렌더링 보강
- Docker 실행 지원

### 개발 환경 실행
```bash
npm install
npm run dev
```

브라우저에서 다음 주소를 엽니다.

```text
http://localhost:3000
```

### 프로덕션 빌드 실행
```bash
npm run build
npm start
```

### Docker 실행
기본 포트는 `3001`입니다.

```bash
docker compose up --build
```

브라우저에서 다음 주소를 엽니다.

```text
http://localhost:3001
```

다른 포트를 쓰고 싶다면:

```bash
PORT=3010 docker compose up --build
```

### 사용 방법
1. 이미지를 업로드하거나 붙여넣습니다.
2. 워터마크 문구를 입력합니다.
3. 위치 / 투명도 / 여백 / 글자 크기 / 색상을 조절합니다.
4. 미리보기를 확인합니다.
5. `워터마크 PNG 다운로드` 버튼으로 저장합니다.

### API 입력값
`/api/preview`, `/api/export` 모두 `multipart/form-data`를 받습니다.

- `image`: 업로드 이미지 파일
- `text`: 워터마크 문구
- `placement`: `top-left`, `top-right`, `bottom-left`, `bottom-right`, `diagonal-single`, `diagonal-tile`
- `opacity`: `0.05` ~ `1`
- `margin`: 최소 `1`
- `fontSize`: 글자 크기
- `color`: 예시 `#cbc8c8`

### 참고 사항
- export 결과는 현재 PNG 고정입니다.
- 아주 큰 이미지에서 대각선 반복은 느릴 수 있습니다.
- 시스템/환경에 따라 글꼴 모양은 약간 달라질 수 있습니다.

---

## English

### Overview
This is a web app for uploading or pasting an image, applying a text watermark, previewing the result, and downloading it as PNG.

### Features
- Upload / drag and drop / paste image support
- Watermark text input
- Placement options
  - top-left
  - top-right
  - bottom-left
  - bottom-right
  - diagonal-single
  - diagonal-tile
- Opacity / margin / font size / color controls
- Result preview
- PNG download
- Better Korean font rendering support
- Docker-ready setup

### Run in development
```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

### Run production build
```bash
npm run build
npm start
```

### Run with Docker
Default host port is `3001`.

```bash
docker compose up --build
```

Open:

```text
http://localhost:3001
```

To use another port:

```bash
PORT=3010 docker compose up --build
```

### How to use
1. Upload or paste an image.
2. Enter the watermark text.
3. Adjust placement / opacity / margin / font size / color.
4. Check the preview.
5. Click `워터마크 PNG 다운로드` to save the result.

### API fields
Both `/api/preview` and `/api/export` expect `multipart/form-data`.

- `image`: uploaded image file
- `text`: watermark text
- `placement`: `top-left`, `top-right`, `bottom-left`, `bottom-right`, `diagonal-single`, `diagonal-tile`
- `opacity`: `0.05` to `1`
- `margin`: minimum `1`
- `fontSize`: font size
- `color`: example `#cbc8c8`

### Notes
- Export output is currently always PNG.
- Very large images in diagonal tile mode can be slower.
- Typography may vary slightly depending on the system environment.
