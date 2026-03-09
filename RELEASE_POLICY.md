# RELEASE_POLICY

앞으로 이 프로젝트를 수정할 때의 기본 규칙:

1. 프로젝트를 수정한다.
2. 수정 내용을 프로젝트 폴더 안의 텍스트 파일로 남긴다.
   - 권장 위치: `releases/`
   - 권장 파일명: `YYYY-MM-DD-vX.Y.Z.txt`
3. 버전을 올린다.
   - 기본은 patch 증가 (`0.1.1` -> `0.1.2`)
4. 압축 백업 파일을 만든다.
   - 권장 파일명: `watermark-app-vX.Y.Z-YYYY-MM-DD-HHMM-kst.tar.gz`
5. CHANGELOG.md에도 요약을 남긴다.

## 권장 규칙
- 사소한 수정: patch 증가
- 기능 추가: minor 증가
- 큰 구조 변경/호환성 깨짐: major 증가

## 참고
압축 백업은 소스 기준으로 만든다.
기본적으로 `node_modules`, `.next`, `releases/*.tar.gz` 같은 재생성 가능한/대용량 산출물은 제외한다.
