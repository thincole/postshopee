const a0_0x30d0bf=a0_0x71ea;
(function(_0x1152da,_0x2ca4e9) {
  const _0x1a2678=a0_0x71ea,_0x4a2d85=_0x1152da();
  while(!![]) {
    try {
      const _0x5ad52d=parseInt(_0x1a2678(0x1fb))/0x1*(-parseInt(_0x1a2678(0x22d))/0x2)+parseInt(_0x1a2678(0x207))/0x3+-parseInt(_0x1a2678(0x22b))/0x4*(-parseInt(_0x1a2678(0x1f3))/0x5)+parseInt(_0x1a2678(0x231))/0x6*(-parseInt(_0x1a2678(0x205))/0x7)+-parseInt(_0x1a2678(0x201))/0x8+-parseInt(_0x1a2678(0x1f1))/0x9+-parseInt(_0x1a2678(0x1fe))/0xa*(-parseInt(_0x1a2678(0x214))/0xb);
      if(_0x5ad52d===_0x2ca4e9)break;
      else _0x4a2d85['push'](_0x4a2d85['shift']());
    }
    catch(_0x5a93ac) {
      _0x4a2d85['push'](_0x4a2d85['shift']());
    }
  }
}
(a0_0x136f,0x34ede));
const express=require("express"),router=express["Router"](),multer=require("multer"),path=require("path"),VideoTask=require('../models/video.model'),User=require("../models/user.model"),Thread=require("../models/thread.model"), {
  parseExcel,validateRows
}
=require('../utils/excel-parser'),fs=require('fs'),axios=require("axios"),upload=multer( {
  'dest':'uploads/'
}
);
async
function downloadExcelFromDrive(_0x40578a) {
  const _0x2611b2=a0_0x30d0bf,_0x339b71= {
    'TqVzA':_0x2611b2(0x208),'orEwQ':'error','aUrfR':'Link Google Drive không hợp lệ'
  }
  ;
  let _0x2b9af8='';
  const _0x259881=_0x40578a['match'](/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  _0x259881&&(_0x2b9af8=_0x2611b2(0x1f9)+_0x259881[0x1]+'/export?format=xlsx');
  if(!_0x2b9af8) {
    const _0x5a4897=_0x40578a[_0x2611b2(0x21f)](/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    _0x5a4897&&(_0x2b9af8=_0x2611b2(0x1f5)+_0x5a4897[0x1]);
  }
  if(!_0x2b9af8) {
    const _0x575e66=_0x40578a['match'](/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
    _0x575e66&&(_0x2b9af8=_0x2611b2(0x1f5)+_0x575e66[0x1]);
  }
  if(!_0x2b9af8)throw new Error(_0x339b71['aUrfR']);
  const _0xc2c874=path['join']('uploads','drive_excel_'+Date[_0x2611b2(0x20f)]()+_0x2611b2(0x224)),_0x2ed947=await axios( {
    'method':'GET','url':_0x2b9af8,'responseType':'stream','timeout':0x7530,'maxRedirects':0x5
  }
  ),_0x45e0a8=fs[_0x2611b2(0x21b)](_0xc2c874);
  return _0x2ed947['data']['pipe'](_0x45e0a8),await new Promise((_0xb98963,_0x16c63a)=> {
    const _0x5ed1b9=_0x2611b2;
    _0x45e0a8['on'](_0x339b71['TqVzA'],_0xb98963),_0x45e0a8['on'](_0x339b71[_0x5ed1b9(0x217)],_0x16c63a);
  }
  ),_0xc2c874;
}
router['post']("/scan-folder",(_0x24d70b,_0x210359)=> {
  const _0x1c9a29=a0_0x30d0bf,_0x16675d=(_0x24d70b["body"]["folderPath"]||'')['trim']();
  if(!_0x16675d)return _0x210359["json"]( {
    'success':![],'error':'Chưa nhập folder'
  }
  );
  try {
    const _0x2926cf=fs["readdirSync"](_0x16675d),_0x58eb12=_0x2926cf["filter"](_0xd8da4e=>/\.(mp4|mov|avi|mkv|webm|flv|m4v)$/i['test'](_0xd8da4e));
    _0x210359["json"]( {
      'success':!![],'total':_0x2926cf['length'],'videoCount':_0x58eb12['length'],'videos':_0x58eb12['slice'](0x0,0x32)
    }
    );
  }
  catch(_0x56e959) {
    _0x210359["json"]( {
      'success':![],'error':'Folder không tồn tại hoặc không đọc được'
    }
    );
  }
}
),router['post']('/import-excel',upload["single"]('excelFile'),async(_0x1754a0,_0x482fd8)=> {
  const _0x228f69=a0_0x30d0bf,_0x2b427f= {
    'PfuTv':'Chưa chọn file Excel hoặc nhập link Drive','nqDwE':function(_0x49a666,_0x3cb145) {
      return _0x49a666(_0x3cb145);
    }
    ,'SmHRf':function(_0x3c5760,_0x31e0bf) {
      return _0x3c5760+_0x31e0bf;
    }
    ,'hgjeM':'inprogress','smrJl':'exists','ZXddb':"normal",'Ezuww':'created'
  }
  ,_0x4bca0e=(_0x1754a0["body"]["driveLink"]||'')['trim']();
  let _0x2a8d8f=_0x1754a0['file']?_0x1754a0['file']["path"]:null,_0x17c49a=![];
  if(!_0x2a8d8f&&_0x4bca0e)
  try {
    _0x2a8d8f=await downloadExcelFromDrive(_0x4bca0e),_0x17c49a=!![];
  }
  catch(_0x4007be) {
    return _0x482fd8['json']( {
      'success':![],'message':_0x4007be['message']
    }
    );
  }
  if(!_0x2a8d8f)return _0x482fd8["status"](0x190)['json']( {
    'success':![],'message':_0x2b427f["PfuTv"]
  }
  );
  const _0x328830=(_0x1754a0['body']["videoFolder"]||'')["trim"]();
  if(!_0x328830)return _0x482fd8["status"](0x190)['json']( {
    'success':![],'message':"Chưa nhập đường dẫn folder video"
  }
  );
  const _0x76c907=Math["max"](0xa,parseInt(_0x1754a0['body']['delayMin'])||0x3c),_0x485b1b=Math["max"](_0x76c907,parseInt(_0x1754a0["body"]['delayMax'])||0xb4),_0x4d5749=_0x1754a0["body"]['country']||'vn',_0x13fc7b=_0x1754a0["body"]["autoStart"]!=='false';
  try {
    const  {
      rows:_0x13a14e,colMap:_0x3b457b,error:_0x16bc8c
    }
    =_0x2b427f["nqDwE"](parseExcel,_0x2a8d8f);
    if(_0x16bc8c)return _0x482fd8["json"]( {
      'success':![],'message':_0x16bc8c
    }
    );
    if(_0x13a14e["length"]===0x0)return _0x482fd8["json"]( {
      'success':![],'message':"Excel không có dữ liệu hợp lệ"
    }
    );
    const _0x3afb9d=await User['getAll'](),_0x56659f=validateRows(_0x13a14e,_0x328830,_0x3afb9d);
    let _0x155456=0x0;
    _0x56659f['valid']["length"]>0x0&&(_0x155456=await VideoTask["importTasks"](_0x56659f['valid']));
    const _0x3b3ccc=[];
    if(_0x155456>0x0) {
      const _0x461fb8=new Map();
      for(
      const _0x1e336c of _0x56659f["valid"]) {
        _0x461fb8['set'](_0x1e336c["user_id"],_0x2b427f["SmHRf"](_0x461fb8['get'](_0x1e336c['user_id'])||0x0,0x1));
      }
      const _0x1defc3=await Thread["getAll"](),_0x53797a=new Set(_0x1defc3['map'](_0x2271af=>_0x2271af['user_id']));
      for(
      const [_0x4b6bf9,_0x534aa1]of _0x461fb8) {
        if(_0x53797a['has'](_0x4b6bf9)) {
          const _0x4f2919=_0x1defc3["find"](_0x5ec3e4=>_0x5ec3e4['user_id']===_0x4b6bf9);
          if(_0x4f2919) {
            const _0x3fa5cc=require("../database/connection")["getConnection"]();
            await new Promise((_0x1994d3,_0x101f8c)=>_0x3fa5cc["run"]("UPDATE threads SET count_video_upload = count_video_upload + ? WHERE id = ?",[_0x534aa1,_0x4f2919['id']],_0x28d50e=>_0x28d50e?_0x101f8c(_0x28d50e):_0x1994d3())),_0x13fc7b&&(await Thread['updateStatus'](_0x4f2919['id'],_0x2b427f['hgjeM']),await new Promise((_0x53013c,_0x199aaf)=>_0x3fa5cc["run"]('UPDATE threads SET next_run_at = 0 WHERE id = ?',[_0x4f2919['id']],_0x32bcaf=>_0x32bcaf?_0x199aaf(_0x32bcaf):_0x53013c())));
          }
          _0x3b3ccc['push']( {
            'userId':_0x4b6bf9,'taskCount':_0x534aa1,'status':_0x2b427f["smrJl"]
          }
          );
          continue;
        }
        const _0x1e7e66=_0x3afb9d["find"](_0x403c8a=>_0x403c8a['id']===_0x4b6bf9);
        let _0x45c831=null,_0x2a956a=null,_0x2e42ed=null,_0x25bc76=null;
        if(_0x1e7e66?.['proxy']) {
          const _0x626b89=_0x1e7e66['proxy']["split"](':');
          _0x626b89['length']>=0x2&&(_0x45c831=_0x626b89[0x0],_0x2a956a=_0x2b427f["nqDwE"](parseInt,_0x626b89[0x1]),_0x626b89["length"]===0x4&&(_0x2e42ed=_0x626b89[0x2],_0x25bc76=_0x626b89[0x3]));
        }
        try {
          const _0x56736c=await Thread["create"](_0x4b6bf9,_0x76c907,_0x485b1b,_0x45c831,_0x2a956a,_0x2e42ed,_0x25bc76,_0x534aa1,_0x534aa1+' video từ Excel',_0x2b427f['ZXddb'],0x0,_0x4d5749);
          _0x13fc7b&&await Thread["updateStatus"](_0x56736c,_0x2b427f['hgjeM']),_0x3b3ccc["push"]( {
            'userId':_0x4b6bf9,'threadId':_0x56736c,'taskCount':_0x534aa1,'status':_0x2b427f["Ezuww"]
          }
          );
        }
        catch(_0x33f59d) {
          _0x3b3ccc['push']( {
            'userId':_0x4b6bf9,'status':"error",'error':_0x33f59d["message"]
          }
          );
        }
      }
    }
    try {
      fs["unlinkSync"](_0x2a8d8f);
    }
    catch(_0x5e8266) {
    }
    const _0x50640d=_0x56659f['valid']['filter'](_0x34fa5b=>_0x34fa5b['product_links']["length"]>0x0)["length"],_0x746973=_0x56659f["valid"]["filter"](_0x5b4cdc=>_0x5b4cdc['product_links']["length"]===0x0)["length"];
    _0x482fd8["json"]( {
      'success':!![],'imported':_0x155456,'withProducts':_0x50640d,'withoutProducts':_0x746973,'colMap':_0x3b457b,'threadsCreated':_0x3b3ccc['filter'](_0x35c9a7=>_0x35c9a7['status']==='created')['length'],'threadsExisted':_0x3b3ccc["filter"](_0x1915a8=>_0x1915a8["status"]==="exists")['length'],'autoStarted':_0x13fc7b,'summary':_0x56659f["summary"],'invalid':_0x56659f["invalid"]["map"](_0x885bd6=>( {
        'row':_0x885bd6["index"],'account':_0x885bd6['account'],'video':_0x885bd6["video_file"],'error':_0x885bd6["error"]
      }
      ))
    }
    );
  }
  catch(_0x44186b) {
    _0x482fd8["status"](0x1f4)["json"]( {
      'success':![],'message':_0x44186b['message']
    }
    );
  }
}
),router['get']('/task-stats',async(_0x221749,_0x2a236e)=> {
  const _0x22f24c=a0_0x30d0bf;
  try {
    const _0x26eab6=await VideoTask[_0x22f24c(0x204)](),_0x51a926=await VideoTask[_0x22f24c(0x1ef)]();
    _0x2a236e[_0x22f24c(0x223)]( {
      'success':!![],'stats':_0x26eab6,'byUser':_0x51a926
    }
    );
  }
  catch(_0x4bbbdd) {
    _0x2a236e['status'](0x1f4)[_0x22f24c(0x223)]( {
      'error':_0x4bbbdd[_0x22f24c(0x212)]
    }
    );
  }
}
),router['get']("/tasks",async(_0x1c656a,_0x725f4f)=> {
  const _0x478998=a0_0x30d0bf,_0x3e3141= {
    'AJfKX':function(_0x36e532,_0xf4944a) {
      return _0x36e532(_0xf4944a);
    }
    ,'zzMCa':function(_0x50acbc,_0x3d3f2b) {
      return _0x50acbc(_0x3d3f2b);
    }
    ,'Hjzpx':"../database/connection"
  }
  ;
  try {
    const _0x39db02=_0x1c656a['query']["userId"]?_0x3e3141["zzMCa"](parseInt,_0x1c656a['query']["userId"]):null;
    if(_0x39db02) {
      const _0x2d24d6=require(_0x3e3141['Hjzpx'])["getConnection"](),_0x1201fd=await new Promise((_0x4fda8a,_0x25262b)=> {
        const _0x56286f=_0x478998;
        _0x2d24d6[_0x56286f(0x1ff)]('SELECT * FROM video_tasks WHERE user_id = ? ORDER BY id',[_0x39db02],(_0x237e5d,_0x51dc10)=> {
          const _0x19b858=_0x56286f;
          if(_0x237e5d)return _0x3e3141[_0x19b858(0x210)](_0x25262b,_0x237e5d);
          _0x4fda8a(_0x51dc10||[]);
        }
        );
      }
      );
      return _0x725f4f["json"](_0x1201fd);
    }
    const _0x7847c=await VideoTask["getAll"](0xc8);
    _0x725f4f["json"](_0x7847c);
  }
  catch(_0x2c38ae) {
    _0x725f4f['status'](0x1f4)['json']( {
      'error':_0x2c38ae['message']
    }
    );
  }
}
),router['delete']("/tasks",async(_0x2274c9,_0x5577e8)=> {
  const _0x273eff=a0_0x30d0bf;
  try {
    await VideoTask['deleteAll'](),_0x5577e8[_0x273eff(0x223)]( {
      'success':!![],'message':'Đã xoá tất cả tasks'
    }
    );
  }
  catch(_0x504e05) {
    _0x5577e8[_0x273eff(0x209)](0x1f4)[_0x273eff(0x223)]( {
      'error':_0x504e05['message']
    }
    );
  }
}
),router['post']('/tasks/retry',async(_0x310c10,_0x95baf5)=> {
  try {
    const _0x45a25c=await VideoTask['retryAllFailed']();
    _0x95baf5['json']( {
      'success':!![],'message':'Đã retry '+_0x45a25c+' tasks','count':_0x45a25c
    }
    );
  }
  catch(_0x173f20) {
    _0x95baf5['status'](0x1f4)['json']( {
      'error':_0x173f20['message']
    }
    );
  }
}
),module['exports']=router;
function a0_0x71ea(_0x5643e6,_0x836289) {
  const _0x136fb5=a0_0x136f();
  return a0_0x71ea=function(_0x71ea4a,_0x35e53c) {
    _0x71ea4a=_0x71ea4a-0x1ed;
    let _0x18ce47=_0x136fb5[_0x71ea4a];
    if(a0_0x71ea['qjFiWV']===undefined) {
      var _0x4a9158=function(_0x2ca72b) {
        const _0x36892a='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';
        let _0x8d4f16='',_0x43e71c='';
        for(
        let _0x285b8a=0x0,_0x3b01ff,_0x6b6603,_0xa45772=0x0;
        _0x6b6603=_0x2ca72b['charAt'](_0xa45772++);
        ~_0x6b6603&&(_0x3b01ff=_0x285b8a%0x4?_0x3b01ff*0x40+_0x6b6603:_0x6b6603,_0x285b8a++%0x4)?_0x8d4f16+=String['fromCharCode'](0xff&_0x3b01ff>>(-0x2*_0x285b8a&0x6)):0x0) {
          _0x6b6603=_0x36892a['indexOf'](_0x6b6603);
        }
        for(
        let _0x8b8f65=0x0,_0x20eccf=_0x8d4f16['length'];
        _0x8b8f65<_0x20eccf;
        _0x8b8f65++) {
          _0x43e71c+='%'+('00'+_0x8d4f16['charCodeAt'](_0x8b8f65)['toString'](0x10))['slice'](-0x2);
        }
        return decodeURIComponent(_0x43e71c);
      }
      ;
      a0_0x71ea['wJQycd']=_0x4a9158,_0x5643e6=arguments,a0_0x71ea['qjFiWV']=!![];
    }
    const _0x3b4fbf=_0x136fb5[0x0],_0x27a904=_0x71ea4a+_0x3b4fbf,_0x4d8a44=_0x5643e6[_0x27a904];
    return!_0x4d8a44?(_0x18ce47=a0_0x71ea['wJQycd'](_0x18ce47),_0x5643e6[_0x27a904]=_0x18ce47):_0x18ce47=_0x4d8a44,_0x18ce47;
  }
  ,a0_0x71ea(_0x5643e6,_0x836289);
}
function a0_0x136f() {
  const _0x58ed03=['zMLSDgvY','ChvZAa','mtuXntb6q3rqtuG','ywXS','uM91DgvY','mtq0mtG0sxztBLni','CNvU','BNfeD0u','z2v0u3rHDhm','mtrpvxr4rha','ugz1vhy','odK1nJm4rvHMsMf6','zMLUAxnO','C3rHDhvZ','rxP1D3C','ENPnq2e','C2LUz2XL','DxnLCL9Pza','Dw5SAw5Ru3LUyW','BM93','quPMs1G','yxv0B1n0yxj0','BwvZC2fNzq','yxHPB3m','ntvcB3r2wNi','DxnLCKLK','DMLKzw9FzMLSzq','B3jfD1e','y3jLyxrL','DxbKyxrLu3rHDhvZ','BM9YBwfS','y3jLyxrLv3jPDgvtDhjLyw0','Aw1WB3j0vgfZA3m','Bwf4','BwfW','Bwf0y2G','DMLKzw9gB2XKzxi','CMvHzgrPCLn5BMm','q2JgSgeGBMJHUQ1WimsrXRdHU51UzYbK4BQRBIbMB2XKzxiGDMLKzw8','ANnVBG','lNHSC3G','z2v0qwXS','yM9KEq','lI4VBw9KzwXZl3vZzxiUBw9KzwW','l3rHC2TZ','zxHPC3rZ','BxvSDgvY','nte5nNfvtKn6AW','C3vTBwfYEq','mJy2mtr1AMXMt3q','Aw5KzxG','rxHJzwWGA2JdTg5NigpdSYbK4BUVigXP4BUhDsbO4BUJCcbS4BUh','zMLUza','mtaYmtyYuwTluMjz','Aw52ywXPza','lI4VBw9KzwXZl3rOCMvHzc5TB2rLBa','BgvUz3rO','DMfSAwq','u21iuMy','C21YsMW','Cgf0Aa','C3bSAxq','lI4Vzgf0ywjHC2uVy29UBMvJDgLVBG','zhjPDMvmAw5R','z2v0u3rHDhncEvvZzxi','z2v0q29UBMvJDgLVBG','mtiWote4nNfjA0D4AW','zxHWCMvZCW','ndi1wfjUyMvb','zxjYB3i','Ahr0Chm6lY9KCML2zs5NB29NBguUy29Tl3vJp2v4Cg9YDd1KB3DUBg9HzczPzd0','DhjPBq','zM9SzgvYugf0Aa','vvbeqvrfihrOCMvHzhmGu0vuignVDw50x3zPzgvVx3vWBg9Hzca9ignVDw50x3zPzgvVx3vWBg9HzcaRid8Gv0HfuKuGAwqGpsa/','Ahr0Chm6lY9KB2nZlMDVB2DSzs5JB20VC3bYzwfKC2HLzxrZl2qV','l3nJyw4TzM9SzgvY','mvntve5qCW'];
  a0_0x136f=function() {
    return _0x58ed03;
  }
  ;
  return a0_0x136f();
}