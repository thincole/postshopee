const COUNTRIES = {
    vn: {
        code: 'vn',
        name: 'Việt Nam',
        tld: 'vn',
        timezone: 'Asia/Ho_Chi_Minh',
        language: 'vi',
        appId: 'com.shopee.vn',
        coverPrefix: 'vn-11134114-7ras8',
        defaultCoverId: 'vn-11134114-7ras8-mccff7oz208s9a',
        musicCoverFallback: 'vn-11134233-7ras8-m2ffztot9l84a8'
    },
    sg: {
        code: 'sg',
        name: 'Singapore',
        tld: 'sg',
        timezone: 'Asia/Singapore',
        language: 'en',
        appId: 'com.shopee.sg',
        coverPrefix: 'sg-11134114-7ras8',
        defaultCoverId: 'sg-11134114-7ras8-mccff7oz208s9a',
        musicCoverFallback: 'sg-11134233-7ras8-m2ffztot9l84a8'
    },
    ph: {
        code: 'ph',
        name: 'Philippines',
        tld: 'ph',
        timezone: 'Asia/Manila',
        language: 'en',
        appId: 'com.shopee.ph',
        coverPrefix: 'ph-11134114-7ras8',
        defaultCoverId: 'ph-11134114-7ras8-mccff7oz208s9a',
        musicCoverFallback: 'ph-11134233-7ras8-m2ffztot9l84a8'
    },
    id: {
        code: 'id',
        name: 'Indonesia',
        tld: 'co.id',
        timezone: 'Asia/Jakarta',
        language: 'id',
        appId: 'com.shopee.id',
        coverPrefix: 'id-11134114-7ras8',
        defaultCoverId: 'id-11134114-7ras8-mccff7oz208s9a',
        musicCoverFallback: 'id-11134233-7ras8-m2ffztot9l84a8'
    },
    th: {
        code: 'th',
        name: 'Thailand',
        tld: 'co.th',
        timezone: 'Asia/Bangkok',
        language: 'th',
        appId: 'com.shopee.th',
        coverPrefix: 'th-11134114-7ras8',
        defaultCoverId: 'th-11134114-7ras8-mccff7oz208s9a',
        musicCoverFallback: 'th-11134233-7ras8-m2ffztot9l84a8'
    },
    my: {
        code: 'my',
        name: 'Malaysia',
        tld: 'com.my',
        timezone: 'Asia/Kuala_Lumpur',
        language: 'en',
        appId: 'com.shopee.my',
        coverPrefix: 'my-11134114-7ras8',
        defaultCoverId: 'my-11134114-7ras8-mccff7oz208s9a',
        musicCoverFallback: 'my-11134233-7ras8-m2ffztot9l84a8'
    },
    br: {
        code: 'br',
        name: 'Brazil',
        tld: 'com.br',
        timezone: 'America/Sao_Paulo',
        language: 'pt',
        appId: 'com.shopee.br',
        coverPrefix: 'br-11134114-7ras8',
        defaultCoverId: 'br-11134114-7ras8-mccff7oz208s9a',
        musicCoverFallback: 'br-11134233-7ras8-m2ffztot9l84a8'
    },
    ar: {
        code: 'ar',
        name: 'Argentina',
        tld: 'com.ar',
        timezone: 'America/Argentina/Buenos_Aires',
        language: 'es',
        appId: 'com.shopee.ar',
        coverPrefix: 'ar-11134114-7ras8',
        defaultCoverId: 'ar-11134114-7ras8-mccff7oz208s9a',
        musicCoverFallback: 'ar-11134233-7ras8-m2ffztot9l84a8'
    },
    mx: {
        code: 'mx',
        name: 'México',
        tld: 'com.mx',
        timezone: 'America/Mexico_City',
        language: 'es',
        appId: 'com.shopee.mx',
        coverPrefix: 'mx-11134114-7ras8',
        defaultCoverId: 'mx-11134114-7ras8-mccff7oz208s9a',
        musicCoverFallback: 'mx-11134233-7ras8-m2ffztot9l84a8'
    },
    tw: {
        code: 'tw',
        name: 'Đài Loan',
        tld: 'tw',
        timezone: 'Asia/Taipei',
        language: 'zh-hant',
        appId: 'com.shopee.tw',
        coverPrefix: 'tw-11134114-7ras8',
        defaultCoverId: 'tw-11134114-7ras8-mccff7oz208s9a',
        musicCoverFallback: 'tw-11134233-7ras8-m2ffztot9l84a8'
    }
};

function getCountry(code) {
    if (!code) return COUNTRIES.vn;
    let cleanCode = String(code).trim().toLowerCase();
    if (cleanCode === 'phss') cleanCode = 'ph';
    return COUNTRIES[cleanCode] || COUNTRIES.vn;
}

function buildUrls(code) {
    const country = getCountry(code);
    const tld = country.tld;

    return {
        SV_HOST: 'sv.shopee.' + tld,
        LIVE_HOST: 'live.shopee.' + tld,
        SV_BASE: 'https://sv.shopee.' + tld,
        LIVE_BASE: 'https://live.shopee.' + tld,
        SHOPEE_BASE: 'https://shopee.' + tld,
        UPLOAD_IMAGE: 'https://sv.shopee.' + tld + '/api/v2/biz/file/image',
        PRECHECK: 'https://sv.shopee.' + tld + '/api/v2/biz/post/precheck',
        CREATE_POST: 'https://sv.shopee.' + tld + '/api/v2/biz/post/create?os_type=2&system_version=34&sdk_version=1.61.2&model=samsung%20SM-G991B&android_performance=802',
        POST_PRODUCTS: 'https://sv.shopee.' + tld + '/api/v2/post/products',
        USER_DETAIL: 'https://sv.shopee.' + tld + '/api/v2/user/detail',
        TIMELINE_ME: 'https://sv.shopee.' + tld + '/api/v2/timeline/me',
        PARSE_URL: 'https://live.shopee.' + tld + '/api/v1/item/parse_url',
        PREUPLOAD: 'https://api-quic.mms.shopee.' + tld + '/uploadapi/api/v1/vod/preupload',
        REPORT_UPLOAD: 'https://api-quic.mms.shopee.' + tld + '/uploadapi/api/v1/vod/reportupload',
        PRODUCT_URL: (shopId, itemId) => 'https://shopee.' + tld + '/product/' + shopId + '/' + itemId,
        REFERER: 'https://shopee.' + tld + '/',
        IMG_BASE: 'https://down-' + country.code + '.img.susercontent.com',
        VIDEO_UPLOAD: 'https://up-ws-' + country.code + '.vod.susercontent.com/file/upload',
        VIDEO_DOWNLOAD: (vid) => 'https://down-ws-global.vod.susercontent.com/' + vid + '.mp4'
    };
}

function listCountries() {
    return Object.keys(COUNTRIES).map(code => ({
        code: COUNTRIES[code].code,
        name: COUNTRIES[code].name,
        tld: COUNTRIES[code].tld
    }));
}

module.exports = {
    COUNTRIES,
    getCountry,
    buildUrls,
    listCountries
};