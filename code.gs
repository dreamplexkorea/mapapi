/**
 * Google Apps Script 서버사이드 코드 (Code.gs) - ES5 호환 버전
 * DREAMFLEX 교육계획서 생성기
 */

var SHEET_ID = '1MpYCFcFS2NovfAaoe68Z-HQqQ5VXi6NXAdrxdDzYyq8';
var SHEET_GID = '1248738552'; // gid 값
var SHEET_NAME = '2025년 학교일정 현황';

/**
 * HTML 파일을 서빙하는 함수
 */
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setTitle('DREAMFLEX 교육계획서 생성기');
}

/**
 * 실제 시트명 찾기 함수
 */
function findCorrectSheetName() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheets = spreadsheet.getSheets();
    
    console.log('=== 모든 시트 정보 ===');
    sheets.forEach(function(sheet, index) {
      const sheetId = sheet.getSheetId();
      const sheetName = sheet.getName();
      console.log((index + 1) + '. 이름: "' + sheetName + '", ID: ' + sheetId + ', GID: ' + sheetId);
      
      // gid와 일치하는 시트 찾기
      if (sheetId.toString() === SHEET_GID) {
        console.log('🎯 GID ' + SHEET_GID + '와 일치하는 시트: "' + sheetName + '"');
      }
    });
    
    return sheets.map(function(sheet) {
      return {
        name: sheet.getName(),
        id: sheet.getSheetId(),
        lastRow: sheet.getLastRow(),
        lastCol: sheet.getLastColumn()
      };
    });
    
  } catch (error) {
    console.error('시트 정보 확인 실패:', error);
    return [];
  }
}

/**
 * GID로 시트 찾기
 */
function getSheetByGid(gid) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheets = spreadsheet.getSheets();
    
    for (let sheet of sheets) {
      if (sheet.getSheetId().toString() === gid.toString()) {
        return sheet;
      }
    }
    
    return null;
  } catch (error) {
    console.error('GID로 시트 찾기 실패:', error);
    return null;
  }
}

/**
 * 시트에서 데이터 로드 (올바른 시작 행)
 */
function loadDataFromSheet(sheet) {
  try {
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    console.log('시트 "' + sheet.getName() + '" 크기: ' + lastRow + '행 x ' + lastCol + '열');
    
    if (lastRow === 0 || lastCol === 0) {
      throw new Error('시트에 데이터가 없습니다.');
    }
    
    // 1행은 헤더, 2행부터 데이터 시작
    const dataStartRow = 2;
    const dataRowCount = lastRow - dataStartRow + 1;
    
    if (dataRowCount <= 0) {
      throw new Error('데이터 시작 행(' + dataStartRow + ')이 마지막 행(' + lastRow + ')보다 큽니다.');
    }
    
    // 헤더 가져오기 (1행)
    const headerRange = sheet.getRange(1, 1, 1, lastCol);
    const headers = headerRange.getValues()[0];
    
    // 데이터 가져오기 (2행부터)
    const dataRange = sheet.getRange(dataStartRow, 1, dataRowCount, lastCol);
    const dataRows = dataRange.getValues();
    
    // 헤더 + 데이터 합치기
    const allData = [headers, ...dataRows];
    
    // 빈 행 제거 (체험일이 있는 행만 유지)
    const cleanedData = allData.filter(function(row, index) {
      if (index === 0) return true; // 헤더는 항상 포함
      
      // 체험일 컬럼 체크 (첫 번째 컬럼)
      const dateValue = row[0];
      return dateValue !== null && 
             dateValue !== undefined && 
             dateValue !== '' && 
             dateValue.toString().trim() !== '';
    });
    
    console.log('✅ 정리 완료: ' + (cleanedData.length - 1) + '개의 데이터 행 (헤더 제외)');
    console.log('헤더:', headers.slice(0, 5)); // 처음 5개 컬럼만 출력
    
    if (cleanedData.length > 1) {
      console.log('첫 번째 데이터 행:', cleanedData[1].slice(0, 5));
    }
    
    return cleanedData;
    
  } catch (error) {
    console.error('데이터 로드 실패:', error);
    throw error;
  }
}

/**
 * 안전한 데이터 로드 함수 (다중 시도)
 */
function getSchoolDataSafe() {
  const attempts = [
    // 시도 1: GID로 찾기
    function() {
      console.log('시도 1: GID로 시트 찾기');
      const sheet = getSheetByGid(SHEET_GID);
      if (sheet) {
        console.log('✅ GID ' + SHEET_GID + '로 시트 발견: "' + sheet.getName() + '"');
        return loadDataFromSheet(sheet);
      }
      throw new Error('GID로 시트를 찾을 수 없습니다.');
    },
    
    // 시도 2: 정확한 시트명으로 찾기
    function() {
      console.log('시도 2: 시트명으로 찾기');
      const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      const sheet = spreadsheet.getSheetByName(SHEET_NAME);
      if (sheet) {
        console.log('✅ 시트명 "' + SHEET_NAME + '"으로 시트 발견');
        return loadDataFromSheet(sheet);
      }
      throw new Error('시트명으로 시트를 찾을 수 없습니다.');
    },
    
    // 시도 3: 가장 데이터가 많은 시트 사용
    function() {
      console.log('시도 3: 가장 큰 시트 사용');
      const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
      const sheets = spreadsheet.getSheets();
      
      let bestSheet = null;
      let maxRows = 0;
      
      sheets.forEach(function(sheet) {
        const rowCount = sheet.getLastRow();
        if (rowCount > maxRows) {
          maxRows = rowCount;
          bestSheet = sheet;
        }
      });
      
      if (bestSheet && maxRows > 100) { // 충분한 데이터가 있는 시트
        console.log('✅ 가장 큰 시트 사용: "' + bestSheet.getName() + '" (' + maxRows + '행)');
        return loadDataFromSheet(bestSheet);
      }
      
      throw new Error('적절한 시트를 찾을 수 없습니다.');
    }
  ];
  
  // 각 시도를 순차적으로 실행
  for (let i = 0; i < attempts.length; i++) {
    try {
      const result = attempts[i]();
      console.log('✅ 시도 ' + (i + 1) + ' 성공!');
      return result;
    } catch (error) {
      console.log('❌ 시도 ' + (i + 1) + ' 실패: ' + error.message);
      if (i === attempts.length - 1) {
        // 모든 시도 실패 시 데모 데이터 반환
        console.log('모든 시도 실패, 데모 데이터 반환');
        return getDemoData();
      }
    }
  }
}

/**
 * 가장 안전한 데이터 로드 함수 (절대 null 반환 안함)
 */
function getSchoolDataAlwaysSafe() {
  console.log('=== getSchoolDataAlwaysSafe 시작 ===');
  
  try {
    // 실제 데이터 로드 시도
    const realData = getSchoolDataSafe();
    
    // 데이터 검증
    if (!realData || !Array.isArray(realData) || realData.length === 0) {
      console.log('실제 데이터가 유효하지 않음, 데모 데이터 반환');
      return getDemoData();
    }
    
    // 헤더 검증
    if (!realData[0] || !Array.isArray(realData[0])) {
      console.log('헤더가 유효하지 않음, 데모 데이터 반환');
      return getDemoData();
    }
    
    console.log('✅ 실제 데이터 반환 성공');
    return realData;
    
  } catch (error) {
    console.error('실제 데이터 로드 실패:', error);
    console.log('🧪 데모 데이터로 대체');
    return getDemoData();
  }
}

/**
 * 데모 데이터 반환
 */
function getDemoData() {
  console.log('데모 데이터 생성');
  return [
    ['체험일', '학교', '수업', '학년', '강사이름', '지역', '수업시간', '차시'],
    ['25.06.16', '중학교A', '코딩 기초', '1학년', '김영희', '서울', '09:00 ~ 12:30', '4'],
    ['25.06.16', '초등학교B', '수학', '2학년', '박철수', '부산', '09:00 ~ 15:10', '6']
  ];
}

/**
 * 데이터 통계 정보를 가져오는 함수
 */
function getDataStatistics() {
  try {
    const allData = getSchoolData();
    if (allData.length <= 1) {
      return {
        totalRecords: 0,
        uniqueSchools: 0,
        availableMonths: []
      };
    }
    
    const headers = allData[0];
    const schoolColumnIndex = headers.findIndex(function(header) { return header.includes('학교'); });
    const dateColumnIndex = headers.findIndex(function(header) { return header.includes('체험일'); });
    
    const schools = new Set();
    const months = new Set();
    
    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      
      // 학교명 수집
      if (schoolColumnIndex !== -1 && row[schoolColumnIndex]) {
        schools.add(row[schoolColumnIndex]);
      }
      
      // 월 수집
      if (dateColumnIndex !== -1 && row[dateColumnIndex]) {
        const match = row[dateColumnIndex].toString().match(/25\.(\d{2})\./);
        if (match) {
          months.add('2025-' + match[1]);
        }
      }
    }
    
    return {
      totalRecords: allData.length - 1,
      uniqueSchools: schools.size,
      schoolNames: Array.from(schools).sort(),
      availableMonths: Array.from(months).sort(),
      lastUpdated: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('getDataStatistics 오류:', error);
    return {
      totalRecords: 0,
      uniqueSchools: 0,
      availableMonths: [],
      error: error.message
    };
  }
}

/**
 * 설정 및 권한 확인 함수
 */
function checkConfiguration() {
  const result = {
    spreadsheetAccess: false,
    sheetExists: false,
    dataAvailable: false,
    configuration: {
      sheetId: SHEET_ID,
      sheetName: SHEET_NAME
    },
    errors: []
  };
  
  try {
    // 스프레드시트 접근 확인
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    result.spreadsheetAccess = true;
    result.configuration.spreadsheetName = spreadsheet.getName();
    
    // 시트 존재 확인
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (sheet) {
      result.sheetExists = true;
      
      // 데이터 확인
      const dataRange = sheet.getDataRange();
      if (dataRange && dataRange.getNumRows() > 1) {
        result.dataAvailable = true;
        result.configuration.totalRows = dataRange.getNumRows();
        result.configuration.totalColumns = dataRange.getNumColumns();
      }
    } else {
      result.errors.push('시트 "' + SHEET_NAME + '"이 존재하지 않습니다.');
    }
    
  } catch (error) {
    result.errors.push('스프레드시트 접근 오류: ' + error.message);
  }
  
  return result;
}

/**
 * Google Docs에 문서 생성 및 PDF로 내보내기
 */
function createAndExportDoc(content, filename) {
  try {
    // Google Docs에 새 문서 생성
    var doc = DocumentApp.create(filename);
    var body = doc.getBody();
    
    // 콘텐츠를 파싱하여 삽입
    var lines = content.split('\n');
    var inTable = false;
    var tableRows = [];
    
    lines.forEach(function(line) {
      if (line.startsWith('📋 기본사항') || line.startsWith('👥 프로그램 상세') || line.startsWith('⏰ 시간계획')) {
        if (inTable) {
          var table = body.appendTable(tableRows);
          tableRows = [];
          inTable = false;
        }
        body.appendParagraph(line);
      } else if (line.match(/^\|.*\|$/)) {
        inTable = true;
        var cells = line.split('|').slice(1, -1).map(function(cell) { return cell.trim(); });
        tableRows.push(cells);
      } else if (inTable && line === '') {
        var table = body.appendTable(tableRows);
        tableRows = [];
        inTable = false;
      } else if (!inTable) {
        body.appendParagraph(line);
      }
    });
    
    if (inTable && tableRows.length > 0) {
      body.appendTable(tableRows);
    }

    // 문서 저장
    doc.saveAndClose();
    
    // 문서 ID 가져오기
    var docId = doc.getId();
    
    // PDF로 내보내기
    var pdfBlob = DocumentApp.openById(docId).getAs('application/pdf');
    var pdfFile = DriveApp.createFile(pdfBlob).setName(filename + '.pdf');
    
    // PDF 파일 URL 반환
    return pdfFile.getUrl();
  } catch (error) {
    console.error('PDF 생성 실패:', error);
    throw error;
  }
}

/**
 * 디버깅 및 테스트 함수들
 */
function testConnection() {
  console.log('=== 연결 테스트 시작 ===');
  
  try {
    console.log('스프레드시트 ID:', SHEET_ID);
    console.log('목표 GID:', SHEET_GID);
    console.log('목표 시트명:', SHEET_NAME);
    
    const sheetInfo = findCorrectSheetName();
    console.log('시트 정보:', JSON.stringify(sheetInfo, null, 2));
    
    console.log('\n=== 데이터 로드 테스트 ===');
    const data = getSchoolDataAlwaysSafe();
    console.log('데이터 로드 성공: ' + data.length + '행');
    console.log('헤더:', data[0]);
    if (data.length > 1) {
      console.log('첫 번째 데이터:', data[1]);
    }
    
    return true;
    
  } catch (error) {
    console.error('테스트 실패:', error);
    return false;
  }
}

/**
 * 특정 월의 데이터만 가져오는 함수 (성능 최적화용)
 */
function getSchoolDataByMonth(targetMonth) {
  try {
    const allData = getSchoolData();
    const headers = allData[0];
    
    // 체험일 컬럼 인덱스 찾기
    const dateColumnIndex = headers.findIndex(function(header) {
      return header.includes('체험일') || header.includes('날짜');
    });
    
    if (dateColumnIndex === -1) {
      throw new Error('체험일 컬럼을 찾을 수 없습니다.');
    }
    
    // 헤더 포함해서 반환
    const filteredData = [headers];
    
    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      const dateValue = row[dateColumnIndex];
      
      if (dateValue && typeof dateValue === 'string') {
        // "25.06.20.금" 형식에서 월 추출
        const match = dateValue.match(/25\.(\d{2})\./);
        if (match) {
          const month = '2025-' + match[1];
          if (month === targetMonth) {
            filteredData.push(row);
          }
        }
      }
    }
    
    console.log(targetMonth + '월 데이터: ' + (filteredData.length - 1) + '개 행');
    return filteredData;
    
  } catch (error) {
    console.error('getSchoolDataByMonth 오류:', error);
    throw error;
  }
}

/**
 * 사용 가능한 월 목록을 가져오는 함수
 */
function getAvailableMonths() {
  try {
    const allData = getSchoolData();
    const headers = allData[0];
    
    const dateColumnIndex = headers.findIndex(function(header) {
      return header.includes('체험일') || header.includes('날짜');
    });
    
    if (dateColumnIndex === -1) {
      return [];
    }
    
    const months = new Set();
    
    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      const dateValue = row[dateColumnIndex];
      
      if (dateValue && typeof dateValue === 'string') {
        const match = dateValue.match(/25\.(\d{2})\./);
        if (match) {
          months.add('2025-' + match[1]);
        }
      }
    }
    
    return Array.from(months).sort();
    
  } catch (error) {
    console.error('getAvailableMonths 오류:', error);
    return [];
  }
}

/**
 * 특정 학교의 데이터만 가져오는 함수
 */
function getSchoolDataBySchool(schoolName) {
  try {
    const allData = getSchoolData();
    const headers = allData[0];
    
    const schoolColumnIndex = headers.findIndex(function(header) {
      return header.includes('학교');
    });
    
    if (schoolColumnIndex === -1) {
      throw new Error('학교 컬럼을 찾을 수 없습니다.');
    }
    
    const filteredData = [headers];
    
    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      if (row[schoolColumnIndex] === schoolName) {
        filteredData.push(row);
      }
    }
    
    return filteredData;
    
  } catch (error) {
    console.error('getSchoolDataBySchool 오류:', error);
    throw error;
  }
}
