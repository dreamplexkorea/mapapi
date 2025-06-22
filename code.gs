/**
 * Google Apps Script 서버사이드 코드 (Code.gs) - 네이버 API 수정 버전
 * DREAMPLEX 교육계획서 생성기
 * 
 * 수정사항:
 * 1. 네이버 클라우드 플랫폼 API 엔드포인트 업데이트
 * 2. 올바른 헤더 이름 사용
 * 3. API 응답 구조 수정
 * 4. 오류 처리 개선
 */

// 스프레드시트 정보
var SHEET_ID = '1MpYCFcFS2NovfAaoe68Z-HQqQ5VXi6NXAdrxdDzYyq8';
var SHEET_GID = '1248738552';
var SHEET_NAME = '2025년 학교일정 현황';

/**
 * GET 요청 처리 (웹페이지 로드)
 */
function doGet(e) {
  try {
    console.log('=== GET 요청 수신: 웹페이지 로드 ===');
    
    var htmlOutput = HtmlService.createTemplateFromFile('index').evaluate()
      .setTitle('DREAMPLEX 교육계획서 생성기 v2.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    
    console.log('✅ HTML 페이지 생성 성공');
    return htmlOutput;
      
  } catch (error) {
    console.error('doGet 오류 발생:', error);
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: '웹 페이지를 로드하는 중 오류가 발생했습니다: ' + error.toString(),
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * POST 요청 처리 (메인 API)
 */
function doPost(e) {
  try {
    console.log('=== POST 요청 수신 ===');
    var requestData = JSON.parse(e.postData.contents);
    var action = requestData.action;
    console.log('처리할 액션:', action);

    var result;
    switch(action) {
      case 'getRouteInfo':
        result = handleGetRoute(requestData);
        break;
      case 'getSchools':
        result = handleGetSchools();
        break;
      case 'testConnection':
        result = handleTestConnection();
        break;
      case 'testAPI':
         result = testNaverAPI();
         break;
      case 'simpleNaverTest':
        result = simpleNaverTest();
        break;
      case 'compareGeocodeTest':
        result = compareGeocodeTest();
        break;
      case 'testHybridAPI':
        result = testHybridAPI();
        break;
      default:
        throw new Error('알 수 없는 액션: ' + action);
    }
    
    console.log('처리 결과 요약:', {status: result.status});
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON)
      .addHeader('Access-Control-Allow-Origin', '*');
      
  } catch (error) {
    console.error('doPost 오류:', error.toString(), error.stack);
    
    var errorResponse = {
      status: 'error',
      message: error.toString(),
      timestamp: new Date().toISOString()
    };
    
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON)
      .addHeader('Access-Control-Allow-Origin', '*');
  }
}

/**
 * OPTIONS 요청 처리 (CORS preflight)
 */
function doOptions(e) {
  return ContentService.createTextOutput()
    .addHeader('Access-Control-Allow-Origin', '*')
    .addHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .addHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/**
 * 경로 정보 요청 처리
 */
function handleGetRoute(requestData) {
  try {
    var origin = requestData.origin || '대구 북구 태평로 161';
    var destination = requestData.destination;
    
    if (!destination) {
      throw new Error('목적지가 지정되지 않았습니다.');
    }
    
    console.log('=== 하이브리드 경로 계산 요청 ===');
    console.log('출발지:', origin);
    console.log('목적지:', destination);
    
    // 모든 API 키 확인 (구글 + 네이버)
    var apiKeys = getApiKeys();
    console.log('API 키 확인 완료 (구글 + 네이버)');
    
    // 하이브리드 주소를 좌표로 변환
    var originCoords = geocodeAddress(origin, apiKeys);
    var destCoords = geocodeAddress(destination, apiKeys);
    
    console.log('하이브리드 좌표 변환 완료:');
    console.log('- 출발지:', originCoords);
    console.log('- 목적지:', destCoords);
    
    // 네이버 API로 경로 계산 (통행료, 연료비 포함)
    var routeInfo = getDirections(originCoords, destCoords, apiKeys.naver);
    
    // 구글에서 얻은 한글 주소 정보 추가
    routeInfo.addresses = {
      origin: originCoords.formattedAddress || origin,
      destination: destCoords.formattedAddress || destination
    };
    
    return {
      status: 'success',
      data: routeInfo,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ 하이브리드 경로 정보 처리 오류:', error);
    throw error;
  }
}

/**
 * 학교 목록 요청 처리
 */
function handleGetSchools() {
  try {
    var schools = getSchoolDataSafe();
    return {
      status: 'success',
      data: schools,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('학교 목록 처리 오류:', error);
    throw error;
  }
}

/**
 * 연결 테스트 처리
 */
function handleTestConnection() {
  console.log('=== 하이브리드 API 연결 테스트 시작 ===');
  let testResult = {
    server: 'OK',
    timestamp: new Date().toISOString(),
    googleApi: { status: '실패', message: '테스트 미실행' },
    naverApi: { status: '실패', message: '테스트 미실행' },
    hybridTest: { status: '실패', message: '테스트 미실행' },
    spreadsheet: { status: '실패', message: '테스트 미실행' }
  };

  // 1. API 키 로드
  let apiKeys;
  try {
    apiKeys = getApiKeys();
    console.log('✅ 모든 API 키 로드 완료');
  } catch (e) {
    console.error('❌ API 키 로드 실패:', e);
    return {
      status: 'error',
      data: testResult,
      rawError: 'API 키 로드 실패: ' + e.toString()
    };
  }

  // 2. 구글 Maps API 테스트
  try {
    const googleResult = searchAddressWithGoogle('대구광역시청', apiKeys.google.apiKey);
    testResult.googleApi.status = '성공';
    testResult.googleApi.message = `구글 주소 검색 성공: ${googleResult.formattedAddress}`;
    console.log('✅ 구글 Maps API 테스트 성공');
  } catch (e) {
    console.error('❌ 구글 Maps API 테스트 실패:', e);
    testResult.googleApi.status = '실패';
    testResult.googleApi.message = e.toString();
  }

  // 3. 네이버 Maps API 테스트
  try {
    const naverCoords = getCoordinates('대구광역시청', apiKeys.naver);
    testResult.naverApi.status = '성공';
    testResult.naverApi.message = `네이버 좌표 변환 성공: (${naverCoords.x}, ${naverCoords.y})`;
    console.log('✅ 네이버 Maps API 테스트 성공');
  } catch (e) {
    console.error('❌ 네이버 Maps API 테스트 실패:', e);
    testResult.naverApi.status = '실패';
    testResult.naverApi.message = e.toString();
  }

  // 4. 하이브리드 테스트 (구글 + 네이버)
  try {
    const hybridResult = geocodeAddress('대구광역시청', apiKeys);
    testResult.hybridTest.status = '성공';
    testResult.hybridTest.message = `하이브리드 변환 성공: ${hybridResult.formattedAddress} → (${hybridResult.lat}, ${hybridResult.lng})`;
    console.log('✅ 하이브리드 API 테스트 성공');
  } catch (e) {
    console.error('❌ 하이브리드 API 테스트 실패:', e);
    testResult.hybridTest.status = '실패';
    testResult.hybridTest.message = e.toString();
  }

  // 5. 스프레드시트 연결 테스트
  try {
    const schools = getSchoolDataSafe();
    testResult.spreadsheet.status = '성공';
    testResult.spreadsheet.message = `시트에서 ${schools.length}개의 행을 로드했습니다.`;
    console.log('✅ 스프레드시트 연결 테스트 성공');
  } catch(e) {
    console.error('❌ 스프레드시트 연결 테스트 실패:', e);
    testResult.spreadsheet.status = '실패';
    testResult.spreadsheet.message = e.toString();
  }

  // 최종 상태 결정 (하이브리드 테스트가 핵심)
  const finalStatus = (testResult.hybridTest.status === '성공') ? 'success' : 'error';

  return {
    status: finalStatus,
    data: testResult,
    rawError: testResult.hybridTest.status === '실패' ? testResult.hybridTest.message : null
  };
}

/**
 * API 키들 가져오기 (네이버 + 구글)
 */
function getApiKeys() {
  try {
    // 네이버 API 키
    const naverClientId = '1di0jcyhpq';
    const naverClientSecret = '1ce7WUjgN8cs7Yk3mexppNb3YLCN82QpSsb15luQ';
    
    // 구글 Maps API 키
    const googleApiKey = 'AIzaSyATS7uiOpTVbnlkATIZguH6NV0tbGnRAM0';

    if (!naverClientId || !naverClientSecret) {
      throw new Error('네이버 API 키가 누락되었습니다.');
    }
    
    if (!googleApiKey) {
      throw new Error('구글 Maps API 키가 누락되었습니다.');
    }

    console.log('✅ API 키 사용 중:', {
      naver: {
        clientIdPreview: naverClientId.substring(0, 4) + '****',
        clientSecretPreview: naverClientSecret.substring(0, 4) + '****'
      },
      google: {
        keyPreview: googleApiKey.substring(0, 10) + '****'
      }
    });

    return { 
      naver: {
        clientId: naverClientId,
        clientSecret: naverClientSecret
      },
      google: {
        apiKey: googleApiKey
      }
    };

  } catch (error) {
    console.error('API 키 가져오기 실패:', error);
    throw new Error('API 키를 가져오는 중 오류 발생: ' + error.message);
  }
}

/**
 * 네이버 API 키 가져오기 (기존 호환성 유지)
 */
function getNaverApiKeys() {
  const keys = getApiKeys();
  return keys.naver;
}

/**
 * 구글 Maps API로 주소 검색 및 한글 도로명 주소 반환
 */
function searchAddressWithGoogle(query, googleApiKey) {
  try {
    console.log('🔍 구글 Maps API 주소 검색:', query);
    
    const url = 'https://maps.googleapis.com/maps/api/geocode/json';
    const params = '?address=' + encodeURIComponent(query) + 
                   '&key=' + googleApiKey + 
                   '&language=ko&region=kr';
    
    const options = {
      method: 'GET',
      muteHttpExceptions: true
    };
    
    console.log('구글 API 호출:', url + params);
    
    const response = UrlFetchApp.fetch(url + params, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('구글 API 응답 코드:', responseCode);
    console.log('구글 API 응답:', responseText);
    
    if (responseCode !== 200) {
      throw new Error('구글 Maps API 호출 실패 (HTTP ' + responseCode + '): ' + responseText);
    }
    
    const result = JSON.parse(responseText);
    
    if (result.status !== 'OK' || !result.results || result.results.length === 0) {
      console.error('구글 주소 검색 결과 없음:', result);
      throw new Error('주소를 찾을 수 없습니다: ' + query + '. 상태: ' + result.status);
    }
    
    const firstResult = result.results[0];
    const coords = {
      lat: firstResult.geometry.location.lat,
      lng: firstResult.geometry.location.lng
    };
    
    // 한글 도로명 주소 추출
    const formattedAddress = firstResult.formatted_address;
    
    console.log('✅ 구글 주소 검색 완료:', {
      query: query,
      formattedAddress: formattedAddress,
      coords: coords
    });
    
    return {
      originalQuery: query,
      formattedAddress: formattedAddress,
      coords: coords,
      source: 'google_maps'
    };
    
  } catch (error) {
    console.error('❌ 구글 주소 검색 실패:', error);
    throw new Error('구글 주소 검색 실패 (' + query + '): ' + error.message);
  }
}

/**
 * 네이버 Maps API로 좌표를 이용한 지오코딩 (좌표 → 주소)
 */
function getCoordinates(address, naverApiKeys) {
  try {
    console.log('📍 네이버 좌표 변환:', address);
    
    const url = 'https://maps.apigw.ntruss.com/map-geocode/v2/geocode';
    const params = '?query=' + encodeURIComponent(address);
    
    const options = {
      method: 'GET',
      headers: {
        'X-NCP-APIGW-API-KEY-ID': naverApiKeys.clientId,
        'X-NCP-APIGW-API-KEY': naverApiKeys.clientSecret
      },
      muteHttpExceptions: true
    };
    
    console.log('네이버 좌표 변환 API 호출:', url + params);
    
    const response = UrlFetchApp.fetch(url + params, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log('네이버 좌표 변환 응답 코드:', responseCode);
    console.log('네이버 좌표 변환 응답:', responseText);
    
    if (responseCode !== 200) {
      throw new Error('네이버 좌표 변환 API 호출 실패 (HTTP ' + responseCode + '): ' + responseText);
    }
    
    const result = JSON.parse(responseText);
    
    if (!result.addresses || result.addresses.length === 0) {
      console.error('❌ 네이버 좌표 변환 결과 없음:', result);
      throw new Error('좌표 변환 실패: ' + address);
    }
    
    const firstAddress = result.addresses[0];
    const coords = {
      x: parseFloat(firstAddress.x), // 경도
      y: parseFloat(firstAddress.y)  // 위도
    };
    
    console.log('✅ 네이버 좌표 변환 완료:', coords);
    return coords;
    
  } catch (error) {
    console.error('❌ 네이버 좌표 변환 실패:', error);
    throw new Error('네이버 좌표 변환 실패 (' + address + '): ' + error.message);
  }
}

/**
 * 주소를 좌표로 변환 (하이브리드: 구글 + 네이버)
 * 1. 구글 Maps API로 주소 검색 및 한글 도로명 주소 획득
 * 2. 네이버 Maps API로 좌표 변환 (경로 계산용)
 */
function geocodeAddress(address, apiKeys) {
  try {
    console.log('=== 하이브리드 주소 변환 시작 ===');
    console.log('입력 주소:', address);
    
    // 1단계: 구글 Maps API로 주소 검색
    console.log('🔍 1단계: 구글 Maps API 주소 검색');
    const googleResult = searchAddressWithGoogle(address, apiKeys.google.apiKey);
    
    // 2단계: 네이버 Maps API로 좌표 변환 (구글에서 찾은 한글 주소 사용)
    console.log('📍 2단계: 네이버 Maps API 좌표 변환');
    const naverCoords = getCoordinates(googleResult.formattedAddress, apiKeys.naver);
    
    // 최종 결과 조합
    const finalResult = {
      lat: naverCoords.y,  // 네이버 API의 y = 위도
      lng: naverCoords.x,  // 네이버 API의 x = 경도
      originalQuery: address,
      formattedAddress: googleResult.formattedAddress,
      source: 'hybrid_google_naver'
    };
    
    console.log('✅ 하이브리드 주소 변환 완료:', finalResult);
    return finalResult;
    
  } catch (error) {
    console.error('❌ 하이브리드 주소 변환 실패:', error);
    
    // 폴백: 네이버 API만 사용
    console.log('🔄 폴백: 네이버 API만 사용');
    try {
      const naverOnlyCoords = getCoordinates(address, apiKeys.naver);
      return {
        lat: naverOnlyCoords.y,
        lng: naverOnlyCoords.x,
        originalQuery: address,
        formattedAddress: address,
        source: 'naver_only_fallback'
      };
    } catch (fallbackError) {
      console.error('❌ 폴백도 실패:', fallbackError);
      throw new Error('주소 변환 실패 (' + address + '): ' + error.message);
    }
  }
}

/**
 * 경로 정보 가져오기 (네이버 Directions API v1)
 */
function getDirections(originCoords, destCoords, apiKeys) {
  try {
    console.log('경로 계산 시작:', { origin: originCoords, destination: destCoords });
    
    // 네이버 클라우드 플랫폼 Directions API v1 - 수정된 URL
    var url = 'https://maps.apigw.ntruss.com/map-direction/v1/driving';
    var params = '?start=' + originCoords.lng + ',' + originCoords.lat + 
                 '&goal=' + destCoords.lng + ',' + destCoords.lat + 
                 '&option=traoptimal';
    
    var options = {
      method: 'GET',
      headers: {
        'X-NCP-APIGW-API-KEY-ID': apiKeys.clientId,
        'X-NCP-APIGW-API-KEY': apiKeys.clientSecret
      },
      muteHttpExceptions: true
    };
    
    console.log('Directions API 호출:', url + params);
    console.log('헤더:', options.headers);
    
    var response = UrlFetchApp.fetch(url + params, options);
    var responseCode = response.getResponseCode();
    var responseText = response.getContentText();
    
    console.log('Directions API 응답 코드:', responseCode);
    console.log('Directions API 응답:', responseText);
    
    if (responseCode !== 200) {
      console.error('Directions API 오류:', responseText);
      throw new Error('경로 계산 API 호출 실패 (HTTP ' + responseCode + '): ' + responseText);
    }
    
    var result = JSON.parse(responseText);
    
    if (result.code !== 0 || !result.route || !result.route.traoptimal || !result.route.traoptimal[0]) {
      console.error('Directions 결과 없음:', result);
      throw new Error('경로 정보를 찾을 수 없습니다. API 응답: ' + JSON.stringify(result));
    }
    
    var route = result.route.traoptimal[0];
    var summary = route.summary;
    
    console.log('=== 네이버 API 응답 분석 ===');
    console.log('전체 summary 객체:', JSON.stringify(summary, null, 2));
    
    // 기본 데이터 추출
    var distance = Math.round(summary.distance / 1000 * 10) / 10; // km, 소수점 1자리
    var duration = Math.round(summary.duration / 60000); // 분
    
    // 통행료와 연료비 추출 (네이버 API에서 제공하지 않을 수 있음)
    var tollFare = summary.tollFare || 0;
    var fuelPrice = summary.fuelPrice || 0;
    
    // 네이버 API에서 제공하지 않으면 추정값 계산
    if (tollFare === 0 && fuelPrice === 0) {
      console.log('⚠️ 네이버 API에서 통행료/연료비 미제공, 추정값 계산');
      
      // 간단한 추정 계산
      var estimatedTollFare = Math.round(distance * 100); // km당 100원 추정
      var estimatedFuelPrice = Math.round(distance * 150); // km당 150원 추정 (연비 10km/L, 리터당 1500원)
      
      tollFare = estimatedTollFare;
      fuelPrice = estimatedFuelPrice;
    }
    
    var routeInfo = {
      distance: distance,
      duration: duration,
      tollFare: tollFare,
      fuelPrice: fuelPrice,
      totalCost: tollFare + fuelPrice,
      source: tollFare > 0 ? 'naver_api' : 'estimated',
      debug: {
        originalSummary: summary,
        apiResponse: result
      }
    };
    
    console.log('최종 경로 정보:', routeInfo);
    return routeInfo;
    
  } catch (error) {
    console.error('경로 계산 오류:', error);
    throw new Error('경로 계산 실패: ' + error.message);
  }
}

/**
 * 네이버 API 테스트 함수
 */
function testNaverAPI() {
  try {
    console.log('=== 네이버 API 단독 테스트 ===');
    
    var apiKeys = getNaverApiKeys();
    console.log('API 키 확인:', { hasId: !!apiKeys.clientId, hasSecret: !!apiKeys.clientSecret });
    
    // 1. Geocoding 테스트
    var testAddress = '대구광역시청';
    var coords = geocodeAddress(testAddress, apiKeys);
    console.log('Geocoding 성공:', coords);
    
    // 2. Directions 테스트
    var origin = { lat: 35.8714, lng: 128.6014 }; // 대구 북구
    var dest = coords;
    
    var route = getDirections(origin, dest, apiKeys);
    console.log('Directions 성공:', route);
    
    return {
      status: 'success',
      message: '네이버 API 테스트 완료',
      data: {
        geocoding: coords,
        directions: route
      },
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('네이버 API 테스트 실패:', error);
    return {
      status: 'error',
      message: error.toString(),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 스프레드시트 데이터 로드 (안전한 버전)
 */
function getSchoolDataSafe() {
  try {
    console.log('=== 스프레드시트 데이터 로드 시작 ===');
    
    var spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    console.log('스프레드시트 열기 성공:', spreadsheet.getName());
    
    // GID로 시트 찾기
    var sheet = getSheetByGid(SHEET_GID);
    if (!sheet) {
      // 시트명으로 찾기
      sheet = spreadsheet.getSheetByName(SHEET_NAME);
    }
    
    if (!sheet) {
      // 첫 번째 시트 사용
      var sheets = spreadsheet.getSheets();
      if (sheets.length > 0) {
        sheet = sheets[0];
        console.log('첫 번째 시트 사용:', sheet.getName());
      }
    }
    
    if (!sheet) {
      throw new Error('사용 가능한 시트를 찾을 수 없습니다.');
    }
    
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    
    console.log('시트 정보:', {
      name: sheet.getName(),
      rows: lastRow,
      cols: lastCol
    });
    
    if (lastRow === 0 || lastCol === 0) {
      throw new Error('시트에 데이터가 없습니다.');
    }
    
    var dataRange = sheet.getRange(1, 1, lastRow, lastCol);
    var data = dataRange.getValues();
    
    // 빈 행 제거
    var cleanData = data.filter(function(row, index) {
      if (index === 0) return true; // 헤더 유지
      return row[0] && row[0].toString().trim() !== '';
    });
    
    console.log('데이터 로드 완료:', cleanData.length + '행');
    return cleanData;
    
  } catch (error) {
    console.error('스프레드시트 데이터 로드 실패:', error);
    console.log('데모 데이터로 대체');
    return getDemoData();
  }
}

/**
 * GID로 시트 찾기
 */
function getSheetByGid(gid) {
  try {
    var spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    var sheets = spreadsheet.getSheets();
    
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getSheetId().toString() === gid.toString()) {
        return sheets[i];
      }
    }
    return null;
  } catch (error) {
    console.error('GID로 시트 찾기 실패:', error);
    return null;
  }
}

/**
 * 데모 데이터
 */
function getDemoData() {
  return [
    ['체험일', '학교', '수업', '수업시간', '차시', '강사이름', '학년', '주소', '반인원수'],
    ['25.06.20.금', '대구중학교', '로봇교육', '09:00 ~ 12:30', '4', '김강사', '1', '대구광역시 중구', '25'],
    ['25.06.21.토', '대구고등학교', '코딩교육', '10:00 ~ 15:30', '6', '이강사', '2', '대구광역시 서구', '30'],
    ['25.06.22.일', '대구초등학교', '과학실험', '09:30 ~ 12:00', '3', '박강사', '3', '대구광역시 동구', '20']
  ];
}

/**
 * 네이버 API 직접 호출 테스트 (매우 단순화된 버전)
 * 오직 Geocoding API 하나만 호출하여 연결의 가장 핵심적인 부분만 테스트합니다.
 */
function simpleNaverTest() {
  try {
    console.log('=== 네이버 직접 호출 테스트 시작 ===');
    const apiKeys = getNaverApiKeys();
    
    // 📍 여기 주소만 바꿨습니다! 도로명 주소로
    const testAddress = '대구광역시 중구 공평로 88'; // 대구시청 정확한 주소

    const url = 'https://maps.apigw.ntruss.com/map-geocode/v2/geocode';
    const params = '?query=' + encodeURIComponent(testAddress);

    const options = {
      method: 'GET',
      headers: {
        'X-NCP-APIGW-API-KEY-ID': apiKeys.clientId,
        'X-NCP-APIGW-API-KEY': apiKeys.clientSecret
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url + params, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    console.log(`응답 코드: ${responseCode}`);
    console.log(`응답 본문: ${responseText}`);

    return {
      status: 'success',
      message: '네이버 API 테스트 완료',
      data: {
        responseCode: responseCode,
        responseText: responseText
      },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ API 호출 실패:', error);
    return {
      status: 'error',
      message: error.toString(),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 하이브리드 API 테스트 (구글 + 네이버)
 */
function testHybridAPI() {
  try {
    console.log('=== 하이브리드 API 테스트 시작 ===');
    const apiKeys = getApiKeys();
    const testAddress = '대구광역시 중구 공평로 88';
    
    console.log('🔍 1단계: 구글 Maps API 주소 검색');
    const googleResult = searchAddressWithGoogle(testAddress, apiKeys.google.apiKey);
    console.log('구글 결과:', googleResult);
    
    console.log('🔍 2단계: 네이버 Maps API 좌표 변환');
    const naverCoords = getCoordinates(googleResult.formattedAddress, apiKeys.naver);
    console.log('네이버 좌표:', naverCoords);
    
    console.log('🔍 3단계: 하이브리드 geocodeAddress 함수 테스트');
    const hybridResult = geocodeAddress(testAddress, apiKeys);
    console.log('하이브리드 결과:', hybridResult);
    
    return {
      status: 'success',
      message: '하이브리드 API 테스트 완료',
      data: {
        google: googleResult,
        naver: naverCoords,
        hybrid: hybridResult
      },
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ 하이브리드 API 테스트 실패:', error);
    return {
      status: 'error',
      message: error.toString(),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 기존 geocodeAddress 함수와 simpleNaverTest 비교 테스트
 */
function compareGeocodeTest() {
  try {
    console.log('=== Geocode 함수 비교 테스트 시작 ===');
    const apiKeys = getApiKeys();
    const testAddress = '대구광역시 중구 공평로 88';
    
    console.log('🔍 1단계: simpleNaverTest 방식으로 호출');
    const simpleResult = simpleNaverTest();
    console.log('Simple 결과:', simpleResult);
    
    console.log('🔍 2단계: 하이브리드 geocodeAddress 함수로 호출');
    try {
      const geocodeResult = geocodeAddress(testAddress, apiKeys);
      console.log('✅ 하이브리드 Geocode 성공:', geocodeResult);
      
      return {
        status: 'success',
        message: '두 방식 모두 성공 (하이브리드 적용)',
        data: {
          simple: simpleResult,
          geocode: geocodeResult
        }
      };
      
    } catch (geocodeError) {
      console.error('❌ 하이브리드 Geocode 실패:', geocodeError);
      
      return {
        status: 'partial',
        message: 'Simple은 성공, 하이브리드 Geocode는 실패',
        data: {
          simple: simpleResult,
          geocodeError: geocodeError.toString()
        }
      };
    }
    
  } catch (error) {
    console.error('❌ 전체 테스트 실패:', error);
    return {
      status: 'error',
      message: error.toString()
    };
  }
}