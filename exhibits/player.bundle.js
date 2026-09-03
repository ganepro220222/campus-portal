var Pi={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Fi={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Bd=0,Bl=1,Rd=2;var Rl=1,ba=2,Xn=3,Fn=0,Ut=1,Mn=2,fi=0,ji=1,Dl=2,Ll=3,Pl=4,Dd=5,wi=100,Ld=101,Pd=102,Fd=103,Ud=104,Nd=200,Od=201,Qd=202,kd=203,ua=204,da=205,Gd=206,Hd=207,Vd=208,zd=209,Wd=210,Kd=211,Xd=212,qd=213,Yd=214,Ba=0,Ra=1,Da=2,$i=3,La=4,Pa=5,Fa=6,Ua=7,Fl=0,Jd=1,Zd=2,Ai=0,jd=1,$d=2,ef=3,Na=4,tf=5,nf=6,sf=7,El="attached",rf="detached",Ul=300,Ui=301,ds=302,Ni=303,Oa=304,go=306,bi=1e3,Ln=1001,Zs=1002,Pt=1003,Qa=1004;var fs=1005;var It=1006,cr=1007;var an=1008;var vt=1009,Nl=1010,Ol=1011,lr=1012,ka=1013,Oi=1014,Dt=1015,mn=1016,Ga=1017,Ha=1018,As=1020,Ql=35902,kl=1021,Gl=1022,Tt=1023,Hl=1024,Vl=1025,Zi=1026,es=1027,qn=1028,Va=1029,pi=1030,za=1031;var Wa=1033,_o=33776,ps=33777,Eo=33778,ms=33779,hr=35840,Ka=35841,ur=35842,Xa=35843,dr=36196,fr=37492,Ar=37496,gs=37808,qa=37809,Ya=37810,Ja=37811,_s=37812,Za=37813,ja=37814,$a=37815,ec=37816,tc=37817,nc=37818,ic=37819,sc=37820,rc=37821,Es=36492,oc=36494,pr=36495,zl=36283,ac=36284,cc=36285,lc=36286;var ts=2300,ns=2301,ha=2302,yl=2400,xl=2401,Cl=2402,of=2500;var Wl=0,yo=1,mr=2,af=3200,cf=3201;var Kl=0,lf=1,In="",et="srgb",yt="srgb-linear",js="linear",it="srgb";var Ji=7680;var Ml=519,hf=512,uf=513,df=514,Xl=515,ff=516,Af=517,pf=518,mf=519,fa=35044;var ql="300 es",kn=2e3,zr=2001,Gn=class{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){if(this._listeners===void 0)return!1;let n=this._listeners;return n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){if(this._listeners===void 0)return;let s=this._listeners[e];if(s!==void 0){let r=s.indexOf(t);r!==-1&&s.splice(r,1)}}dispatchEvent(e){if(this._listeners===void 0)return;let n=this._listeners[e.type];if(n!==void 0){e.target=this;let s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,e);e.target=null}}},Qt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],qu=1234567,Hr=Math.PI/180,is=180/Math.PI;function Pn(){let i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Qt[i&255]+Qt[i>>8&255]+Qt[i>>16&255]+Qt[i>>24&255]+"-"+Qt[e&255]+Qt[e>>8&255]+"-"+Qt[e>>16&15|64]+Qt[e>>24&255]+"-"+Qt[t&63|128]+Qt[t>>8&255]+"-"+Qt[t>>16&255]+Qt[t>>24&255]+Qt[n&255]+Qt[n>>8&255]+Qt[n>>16&255]+Qt[n>>24&255]).toLowerCase()}function Oe(i,e,t){return Math.max(e,Math.min(t,i))}function Yl(i,e){return(i%e+e)%e}function Hp(i,e,t,n,s){return n+(i-e)*(s-n)/(t-e)}function Vp(i,e,t){return i!==e?(t-i)/(e-i):0}function Vr(i,e,t){return(1-t)*i+t*e}function zp(i,e,t,n){return Vr(i,e,1-Math.exp(-t*n))}function Wp(i,e=1){return e-Math.abs(Yl(i,e*2)-e)}function Kp(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*(3-2*i))}function Xp(i,e,t){return i<=e?0:i>=t?1:(i=(i-e)/(t-e),i*i*i*(i*(i*6-15)+10))}function qp(i,e){return i+Math.floor(Math.random()*(e-i+1))}function Yp(i,e){return i+Math.random()*(e-i)}function Jp(i){return i*(.5-Math.random())}function Zp(i){i!==void 0&&(qu=i);let e=qu+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}function jp(i){return i*Hr}function $p(i){return i*is}function em(i){return(i&i-1)===0&&i!==0}function tm(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function nm(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function im(i,e,t,n,s){let r=Math.cos,o=Math.sin,a=r(t/2),c=o(t/2),l=r((e+n)/2),h=o((e+n)/2),u=r((e-n)/2),d=o((e-n)/2),f=r((n-e)/2),m=o((n-e)/2);switch(s){case"XYX":i.set(a*h,c*u,c*d,a*l);break;case"YZY":i.set(c*d,a*h,c*u,a*l);break;case"ZXZ":i.set(c*u,c*d,a*h,a*l);break;case"XZX":i.set(a*h,c*m,c*f,a*l);break;case"YXY":i.set(c*f,a*h,c*m,a*l);break;case"ZYZ":i.set(c*m,c*f,a*h,a*l);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function Dn(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function rt(i,e){switch(e.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var xo={DEG2RAD:Hr,RAD2DEG:is,generateUUID:Pn,clamp:Oe,euclideanModulo:Yl,mapLinear:Hp,inverseLerp:Vp,lerp:Vr,damp:zp,pingpong:Wp,smoothstep:Kp,smootherstep:Xp,randInt:qp,randFloat:Yp,randFloatSpread:Jp,seededRandom:Zp,degToRad:jp,radToDeg:$p,isPowerOfTwo:em,ceilPowerOfTwo:tm,floorPowerOfTwo:nm,setQuaternionFromProperEuler:im,normalize:rt,denormalize:Dn},ve=class i{constructor(e=0,t=0){i.prototype.isVector2=!0,this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){let t=this.x,n=this.y,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6],this.y=s[1]*t+s[4]*n+s[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Oe(this.x,e.x,t.x),this.y=Oe(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Oe(this.x,e,t),this.y=Oe(this.y,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Oe(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Oe(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){let n=Math.cos(t),s=Math.sin(t),r=this.x-e.x,o=this.y-e.y;return this.x=r*n-o*s+e.x,this.y=r*s+o*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},Le=class i{constructor(e,t,n,s,r,o,a,c,l){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,o,a,c,l)}set(e,t,n,s,r,o,a,c,l){let h=this.elements;return h[0]=e,h[1]=s,h[2]=a,h[3]=t,h[4]=r,h[5]=c,h[6]=n,h[7]=o,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){let t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,o=n[0],a=n[3],c=n[6],l=n[1],h=n[4],u=n[7],d=n[2],f=n[5],m=n[8],g=s[0],p=s[3],A=s[6],I=s[1],C=s[4],E=s[7],w=s[2],v=s[5],T=s[8];return r[0]=o*g+a*I+c*w,r[3]=o*p+a*C+c*v,r[6]=o*A+a*E+c*T,r[1]=l*g+h*I+u*w,r[4]=l*p+h*C+u*v,r[7]=l*A+h*E+u*T,r[2]=d*g+f*I+m*w,r[5]=d*p+f*C+m*v,r[8]=d*A+f*E+m*T,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],h=e[8];return t*o*h-t*a*l-n*r*h+n*a*c+s*r*l-s*o*c}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],h=e[8],u=h*o-a*l,d=a*c-h*r,f=l*r-o*c,m=t*u+n*d+s*f;if(m===0)return this.set(0,0,0,0,0,0,0,0,0);let g=1/m;return e[0]=u*g,e[1]=(s*l-h*n)*g,e[2]=(a*n-s*o)*g,e[3]=d*g,e[4]=(h*t-s*c)*g,e[5]=(s*r-a*t)*g,e[6]=f*g,e[7]=(n*c-l*t)*g,e[8]=(o*t-n*r)*g,this}transpose(){let e,t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){let t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,s,r,o,a){let c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*o+l*a)+o+e,-s*l,s*c,-s*(-l*o+c*a)+a+t,0,0,1),this}scale(e,t){return this.premultiply(qc.makeScale(e,t)),this}rotate(e){return this.premultiply(qc.makeRotation(-e)),this}translate(e,t){return this.premultiply(qc.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<9;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}},qc=new Le;function Jl(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function $s(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function gf(){let i=$s("canvas");return i.style.display="block",i}var Yu={};function ys(i){i in Yu||(Yu[i]=!0,console.warn(i))}function _f(i,e,t){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,t);break;default:n()}}setTimeout(r,t)})}function Ef(i){let e=i.elements;e[2]=.5*e[2]+.5*e[3],e[6]=.5*e[6]+.5*e[7],e[10]=.5*e[10]+.5*e[11],e[14]=.5*e[14]+.5*e[15]}function yf(i){let e=i.elements;e[11]===-1?(e[10]=-e[10]-1,e[14]=-e[14]):(e[10]=-e[10],e[14]=-e[14]+1)}var Ju=new Le().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),Zu=new Le().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function sm(){let i={enabled:!0,workingColorSpace:yt,spaces:{},convert:function(s,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===it&&(s.r=ai(s.r),s.g=ai(s.g),s.b=ai(s.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===it&&(s.r=Js(s.r),s.g=Js(s.g),s.b=Js(s.b))),s},fromWorkingColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},toWorkingColorSpace:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===In?js:this.spaces[s].transfer},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,o){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[yt]:{primaries:e,whitePoint:n,transfer:js,toXYZ:Ju,fromXYZ:Zu,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:et},outputColorSpaceConfig:{drawingBufferColorSpace:et}},[et]:{primaries:e,whitePoint:n,transfer:it,toXYZ:Ju,fromXYZ:Zu,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:et}}}),i}var Qe=sm();function ai(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Js(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var Ns,Aa=class{static getDataURL(e){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let t;if(e instanceof HTMLCanvasElement)t=e;else{Ns===void 0&&(Ns=$s("canvas")),Ns.width=e.width,Ns.height=e.height;let n=Ns.getContext("2d");e instanceof ImageData?n.putImageData(e,0,0):n.drawImage(e,0,0,e.width,e.height),t=Ns}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",e),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){let t=$s("canvas");t.width=e.width,t.height=e.height;let n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);let s=n.getImageData(0,0,e.width,e.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=ai(r[o]/255)*255;return n.putImageData(s,0,0),t}else if(e.data){let t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(ai(t[n]/255)*255):t[n]=ai(t[n]);return{data:t,width:e.width,height:e.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}},rm=0,Wr=class{constructor(e=null){this.isSource=!0,Object.defineProperty(this,"id",{value:rm++}),this.uuid=Pn(),this.data=e,this.dataReady=!0,this.version=0}set needsUpdate(e){e===!0&&this.version++}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(Yc(s[o].image)):r.push(Yc(s[o]))}else r=Yc(s);n.url=r}return t||(e.images[this.uuid]=n),n}};function Yc(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Aa.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var om=0,St=class i extends Gn{constructor(e=i.DEFAULT_IMAGE,t=i.DEFAULT_MAPPING,n=Ln,s=Ln,r=It,o=an,a=Tt,c=vt,l=i.DEFAULT_ANISOTROPY,h=In){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:om++}),this.uuid=Pn(),this.name="",this.source=new Wr(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new ve(0,0),this.repeat=new ve(1,1),this.center=new ve(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Le,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.pmremVersion=0}get image(){return this.source.data}set image(e=null){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}toJSON(e){let t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==Ul)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case bi:e.x=e.x-Math.floor(e.x);break;case Ln:e.x=e.x<0?0:1;break;case Zs:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case bi:e.y=e.y-Math.floor(e.y);break;case Ln:e.y=e.y<0?0:1;break;case Zs:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}};St.DEFAULT_IMAGE=null;St.DEFAULT_MAPPING=Ul;St.DEFAULT_ANISOTROPY=1;var je=class i{constructor(e=0,t=0,n=0,s=1){i.prototype.isVector4=!0,this.x=e,this.y=t,this.z=n,this.w=s}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,s){return this.x=e,this.y=t,this.z=n,this.w=s,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=this.w,o=e.elements;return this.x=o[0]*t+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*t+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*t+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*t+o[7]*n+o[11]*s+o[15]*r,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);let t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,s,r,c=e.elements,l=c[0],h=c[4],u=c[8],d=c[1],f=c[5],m=c[9],g=c[2],p=c[6],A=c[10];if(Math.abs(h-d)<.01&&Math.abs(u-g)<.01&&Math.abs(m-p)<.01){if(Math.abs(h+d)<.1&&Math.abs(u+g)<.1&&Math.abs(m+p)<.1&&Math.abs(l+f+A-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;let C=(l+1)/2,E=(f+1)/2,w=(A+1)/2,v=(h+d)/4,T=(u+g)/4,F=(m+p)/4;return C>E&&C>w?C<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(C),s=v/n,r=T/n):E>w?E<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(E),n=v/s,r=F/s):w<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(w),n=T/r,s=F/r),this.set(n,s,r,t),this}let I=Math.sqrt((p-m)*(p-m)+(u-g)*(u-g)+(d-h)*(d-h));return Math.abs(I)<.001&&(I=1),this.x=(p-m)/I,this.y=(u-g)/I,this.z=(d-h)/I,this.w=Math.acos((l+f+A-1)/2),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Oe(this.x,e.x,t.x),this.y=Oe(this.y,e.y,t.y),this.z=Oe(this.z,e.z,t.z),this.w=Oe(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Oe(this.x,e,t),this.y=Oe(this.y,e,t),this.z=Oe(this.z,e,t),this.w=Oe(this.w,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Oe(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},pa=class extends Gn{constructor(e=1,t=1,n={}){super(),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=1,this.scissor=new je(0,0,e,t),this.scissorTest=!1,this.viewport=new je(0,0,e,t);let s={width:e,height:t,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:It,depthBuffer:!0,stencilBuffer:!1,resolveDepthBuffer:!0,resolveStencilBuffer:!0,depthTexture:null,samples:0,count:1},n);let r=new St(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];let o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&(this._depthTexture.renderTarget=null),e!==null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=e,this.textures[s].image.height=t,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let n=0,s=e.textures.length;n<s;n++)this.textures[n]=e.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0,this.textures[n].renderTarget=this;let t=Object.assign({},e.texture.image);return this.texture.source=new Wr(t),this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,e.depthTexture!==null&&(this.depthTexture=e.depthTexture.clone()),this.samples=e.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},Hn=class extends pa{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}},Kr=class extends St{constructor(e=null,t=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Pt,this.minFilter=Pt,this.wrapR=Ln,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}};var er=class extends St{constructor(e=null,t=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:s},this.magFilter=Pt,this.minFilter=Pt,this.wrapR=Ln,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var jt=class{constructor(e=0,t=0,n=0,s=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=s}static slerpFlat(e,t,n,s,r,o,a){let c=n[s+0],l=n[s+1],h=n[s+2],u=n[s+3],d=r[o+0],f=r[o+1],m=r[o+2],g=r[o+3];if(a===0){e[t+0]=c,e[t+1]=l,e[t+2]=h,e[t+3]=u;return}if(a===1){e[t+0]=d,e[t+1]=f,e[t+2]=m,e[t+3]=g;return}if(u!==g||c!==d||l!==f||h!==m){let p=1-a,A=c*d+l*f+h*m+u*g,I=A>=0?1:-1,C=1-A*A;if(C>Number.EPSILON){let w=Math.sqrt(C),v=Math.atan2(w,A*I);p=Math.sin(p*v)/w,a=Math.sin(a*v)/w}let E=a*I;if(c=c*p+d*E,l=l*p+f*E,h=h*p+m*E,u=u*p+g*E,p===1-a){let w=1/Math.sqrt(c*c+l*l+h*h+u*u);c*=w,l*=w,h*=w,u*=w}}e[t]=c,e[t+1]=l,e[t+2]=h,e[t+3]=u}static multiplyQuaternionsFlat(e,t,n,s,r,o){let a=n[s],c=n[s+1],l=n[s+2],h=n[s+3],u=r[o],d=r[o+1],f=r[o+2],m=r[o+3];return e[t]=a*m+h*u+c*f-l*d,e[t+1]=c*m+h*d+l*u-a*f,e[t+2]=l*m+h*f+a*d-c*u,e[t+3]=h*m-a*u-c*d-l*f,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,s){return this._x=e,this._y=t,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){let n=e._x,s=e._y,r=e._z,o=e._order,a=Math.cos,c=Math.sin,l=a(n/2),h=a(s/2),u=a(r/2),d=c(n/2),f=c(s/2),m=c(r/2);switch(o){case"XYZ":this._x=d*h*u+l*f*m,this._y=l*f*u-d*h*m,this._z=l*h*m+d*f*u,this._w=l*h*u-d*f*m;break;case"YXZ":this._x=d*h*u+l*f*m,this._y=l*f*u-d*h*m,this._z=l*h*m-d*f*u,this._w=l*h*u+d*f*m;break;case"ZXY":this._x=d*h*u-l*f*m,this._y=l*f*u+d*h*m,this._z=l*h*m+d*f*u,this._w=l*h*u-d*f*m;break;case"ZYX":this._x=d*h*u-l*f*m,this._y=l*f*u+d*h*m,this._z=l*h*m-d*f*u,this._w=l*h*u+d*f*m;break;case"YZX":this._x=d*h*u+l*f*m,this._y=l*f*u+d*h*m,this._z=l*h*m-d*f*u,this._w=l*h*u-d*f*m;break;case"XZY":this._x=d*h*u-l*f*m,this._y=l*f*u-d*h*m,this._z=l*h*m+d*f*u,this._w=l*h*u+d*f*m;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){let n=t/2,s=Math.sin(n);return this._x=e.x*s,this._y=e.y*s,this._z=e.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){let t=e.elements,n=t[0],s=t[4],r=t[8],o=t[1],a=t[5],c=t[9],l=t[2],h=t[6],u=t[10],d=n+a+u;if(d>0){let f=.5/Math.sqrt(d+1);this._w=.25/f,this._x=(h-c)*f,this._y=(r-l)*f,this._z=(o-s)*f}else if(n>a&&n>u){let f=2*Math.sqrt(1+n-a-u);this._w=(h-c)/f,this._x=.25*f,this._y=(s+o)/f,this._z=(r+l)/f}else if(a>u){let f=2*Math.sqrt(1+a-n-u);this._w=(r-l)/f,this._x=(s+o)/f,this._y=.25*f,this._z=(c+h)/f}else{let f=2*Math.sqrt(1+u-n-a);this._w=(o-s)/f,this._x=(r+l)/f,this._y=(c+h)/f,this._z=.25*f}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<Number.EPSILON?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Oe(this.dot(e),-1,1)))}rotateTowards(e,t){let n=this.angleTo(e);if(n===0)return this;let s=Math.min(1,t/n);return this.slerp(e,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){let n=e._x,s=e._y,r=e._z,o=e._w,a=t._x,c=t._y,l=t._z,h=t._w;return this._x=n*h+o*a+s*l-r*c,this._y=s*h+o*c+r*a-n*l,this._z=r*h+o*l+n*c-s*a,this._w=o*h-n*a-s*c-r*l,this._onChangeCallback(),this}slerp(e,t){if(t===0)return this;if(t===1)return this.copy(e);let n=this._x,s=this._y,r=this._z,o=this._w,a=o*e._w+n*e._x+s*e._y+r*e._z;if(a<0?(this._w=-e._w,this._x=-e._x,this._y=-e._y,this._z=-e._z,a=-a):this.copy(e),a>=1)return this._w=o,this._x=n,this._y=s,this._z=r,this;let c=1-a*a;if(c<=Number.EPSILON){let f=1-t;return this._w=f*o+t*this._w,this._x=f*n+t*this._x,this._y=f*s+t*this._y,this._z=f*r+t*this._z,this.normalize(),this}let l=Math.sqrt(c),h=Math.atan2(l,a),u=Math.sin((1-t)*h)/l,d=Math.sin(t*h)/l;return this._w=o*u+this._w*d,this._x=n*u+this._x*d,this._y=s*u+this._y*d,this._z=r*u+this._z*d,this._onChangeCallback(),this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){let e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(e),s*Math.cos(e),r*Math.sin(t),r*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},b=class i{constructor(e=0,t=0,n=0){i.prototype.isVector3=!0,this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(ju.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(ju.setFromAxisAngle(e,t))}applyMatrix3(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6]*s,this.y=r[1]*t+r[4]*n+r[7]*s,this.z=r[2]*t+r[5]*n+r[8]*s,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){let t=this.x,n=this.y,s=this.z,r=e.elements,o=1/(r[3]*t+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*t+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*t+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*t+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(e){let t=this.x,n=this.y,s=this.z,r=e.x,o=e.y,a=e.z,c=e.w,l=2*(o*s-a*n),h=2*(a*t-r*s),u=2*(r*n-o*t);return this.x=t+c*l+o*u-a*h,this.y=n+c*h+a*l-r*u,this.z=s+c*u+r*h-o*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){let t=this.x,n=this.y,s=this.z,r=e.elements;return this.x=r[0]*t+r[4]*n+r[8]*s,this.y=r[1]*t+r[5]*n+r[9]*s,this.z=r[2]*t+r[6]*n+r[10]*s,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Oe(this.x,e.x,t.x),this.y=Oe(this.y,e.y,t.y),this.z=Oe(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Oe(this.x,e,t),this.y=Oe(this.y,e,t),this.z=Oe(this.z,e,t),this}clampLength(e,t){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Oe(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){let n=e.x,s=e.y,r=e.z,o=t.x,a=t.y,c=t.z;return this.x=s*c-r*a,this.y=r*o-n*c,this.z=n*a-s*o,this}projectOnVector(e){let t=e.lengthSq();if(t===0)return this.set(0,0,0);let n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return Jc.copy(this).projectOnVector(e),this.sub(Jc)}reflect(e){return this.sub(Jc.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){let t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;let n=this.dot(e)/t;return Math.acos(Oe(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){let t=this.x-e.x,n=this.y-e.y,s=this.z-e.z;return t*t+n*n+s*s}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){let s=Math.sin(t)*e;return this.x=s*Math.sin(n),this.y=Math.cos(t)*e,this.z=s*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){let t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){let t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),s=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=s,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},Jc=new b,ju=new jt,Ft=class{constructor(e=new b(1/0,1/0,1/0),t=new b(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(bn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(bn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){let n=bn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);let n=e.geometry;if(n!==void 0){let r=n.getAttribute("position");if(t===!0&&r!==void 0&&e.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)e.isMesh===!0?e.getVertexPosition(o,bn):bn.fromBufferAttribute(r,o),bn.applyMatrix4(e.matrixWorld),this.expandByPoint(bn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),ko.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),ko.copy(n.boundingBox)),ko.applyMatrix4(e.matrixWorld),this.union(ko)}let s=e.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,bn),bn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Pr),Go.subVectors(this.max,Pr),Os.subVectors(e.a,Pr),Qs.subVectors(e.b,Pr),ks.subVectors(e.c,Pr),xi.subVectors(Qs,Os),Ci.subVectors(ks,Qs),Ki.subVectors(Os,ks);let t=[0,-xi.z,xi.y,0,-Ci.z,Ci.y,0,-Ki.z,Ki.y,xi.z,0,-xi.x,Ci.z,0,-Ci.x,Ki.z,0,-Ki.x,-xi.y,xi.x,0,-Ci.y,Ci.x,0,-Ki.y,Ki.x,0];return!Zc(t,Os,Qs,ks,Go)||(t=[1,0,0,0,1,0,0,0,1],!Zc(t,Os,Qs,ks,Go))?!1:(Ho.crossVectors(xi,Ci),t=[Ho.x,Ho.y,Ho.z],Zc(t,Os,Qs,ks,Go))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,bn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(bn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(ei[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),ei[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),ei[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),ei[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),ei[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),ei[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),ei[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),ei[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(ei),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}},ei=[new b,new b,new b,new b,new b,new b,new b,new b],bn=new b,ko=new Ft,Os=new b,Qs=new b,ks=new b,xi=new b,Ci=new b,Ki=new b,Pr=new b,Go=new b,Ho=new b,Xi=new b;function Zc(i,e,t,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){Xi.fromArray(i,r);let a=s.x*Math.abs(Xi.x)+s.y*Math.abs(Xi.y)+s.z*Math.abs(Xi.z),c=e.dot(Xi),l=t.dot(Xi),h=n.dot(Xi);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>a)return!1}return!0}var am=new Ft,Fr=new b,jc=new b,sn=class{constructor(e=new b,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){let n=this.center;t!==void 0?n.copy(t):am.setFromPoints(e).getCenter(n);let s=0;for(let r=0,o=e.length;r<o;r++)s=Math.max(s,n.distanceToSquared(e[r]));return this.radius=Math.sqrt(s),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){let t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){let n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Fr.subVectors(e,this.center);let t=Fr.lengthSq();if(t>this.radius*this.radius){let n=Math.sqrt(t),s=(n-this.radius)*.5;this.center.addScaledVector(Fr,s/n),this.radius+=s}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(jc.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Fr.copy(e.center).add(jc)),this.expandByPoint(Fr.copy(e.center).sub(jc))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}},ti=new b,$c=new b,Vo=new b,Mi=new b,el=new b,zo=new b,tl=new b,ci=class{constructor(e=new b,t=new b(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,ti)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);let n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){let t=ti.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(ti.copy(this.origin).addScaledVector(this.direction,t),ti.distanceToSquared(e))}distanceSqToSegment(e,t,n,s){$c.copy(e).add(t).multiplyScalar(.5),Vo.copy(t).sub(e).normalize(),Mi.copy(this.origin).sub($c);let r=e.distanceTo(t)*.5,o=-this.direction.dot(Vo),a=Mi.dot(this.direction),c=-Mi.dot(Vo),l=Mi.lengthSq(),h=Math.abs(1-o*o),u,d,f,m;if(h>0)if(u=o*c-a,d=o*a-c,m=r*h,u>=0)if(d>=-m)if(d<=m){let g=1/h;u*=g,d*=g,f=u*(u+o*d+2*a)+d*(o*u+d+2*c)+l}else d=r,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*c)+l;else d=-r,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*c)+l;else d<=-m?(u=Math.max(0,-(-o*r+a)),d=u>0?-r:Math.min(Math.max(-r,-c),r),f=-u*u+d*(d+2*c)+l):d<=m?(u=0,d=Math.min(Math.max(-r,-c),r),f=d*(d+2*c)+l):(u=Math.max(0,-(o*r+a)),d=u>0?r:Math.min(Math.max(-r,-c),r),f=-u*u+d*(d+2*c)+l);else d=o>0?-r:r,u=Math.max(0,-(o*d+a)),f=-u*u+d*(d+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy($c).addScaledVector(Vo,d),f}intersectSphere(e,t){ti.subVectors(e.center,this.origin);let n=ti.dot(this.direction),s=ti.dot(ti)-n*n,r=e.radius*e.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=n-o,c=n+o;return c<0?null:a<0?this.at(c,t):this.at(a,t)}intersectsSphere(e){return this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){let t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){let n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){let t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,s,r,o,a,c,l=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,d=this.origin;return l>=0?(n=(e.min.x-d.x)*l,s=(e.max.x-d.x)*l):(n=(e.max.x-d.x)*l,s=(e.min.x-d.x)*l),h>=0?(r=(e.min.y-d.y)*h,o=(e.max.y-d.y)*h):(r=(e.max.y-d.y)*h,o=(e.min.y-d.y)*h),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),u>=0?(a=(e.min.z-d.z)*u,c=(e.max.z-d.z)*u):(a=(e.max.z-d.z)*u,c=(e.min.z-d.z)*u),n>c||a>s)||((a>n||n!==n)&&(n=a),(c<s||s!==s)&&(s=c),s<0)?null:this.at(n>=0?n:s,t)}intersectsBox(e){return this.intersectBox(e,ti)!==null}intersectTriangle(e,t,n,s,r){el.subVectors(t,e),zo.subVectors(n,e),tl.crossVectors(el,zo);let o=this.direction.dot(tl),a;if(o>0){if(s)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Mi.subVectors(this.origin,e);let c=a*this.direction.dot(zo.crossVectors(Mi,zo));if(c<0)return null;let l=a*this.direction.dot(el.cross(Mi));if(l<0||c+l>o)return null;let h=-a*Mi.dot(tl);return h<0?null:this.at(h/o,r)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Pe=class i{constructor(e,t,n,s,r,o,a,c,l,h,u,d,f,m,g,p){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,s,r,o,a,c,l,h,u,d,f,m,g,p)}set(e,t,n,s,r,o,a,c,l,h,u,d,f,m,g,p){let A=this.elements;return A[0]=e,A[4]=t,A[8]=n,A[12]=s,A[1]=r,A[5]=o,A[9]=a,A[13]=c,A[2]=l,A[6]=h,A[10]=u,A[14]=d,A[3]=f,A[7]=m,A[11]=g,A[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(e){let t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){let t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){let t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){let t=this.elements,n=e.elements,s=1/Gs.setFromMatrixColumn(e,0).length(),r=1/Gs.setFromMatrixColumn(e,1).length(),o=1/Gs.setFromMatrixColumn(e,2).length();return t[0]=n[0]*s,t[1]=n[1]*s,t[2]=n[2]*s,t[3]=0,t[4]=n[4]*r,t[5]=n[5]*r,t[6]=n[6]*r,t[7]=0,t[8]=n[8]*o,t[9]=n[9]*o,t[10]=n[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){let t=this.elements,n=e.x,s=e.y,r=e.z,o=Math.cos(n),a=Math.sin(n),c=Math.cos(s),l=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(e.order==="XYZ"){let d=o*h,f=o*u,m=a*h,g=a*u;t[0]=c*h,t[4]=-c*u,t[8]=l,t[1]=f+m*l,t[5]=d-g*l,t[9]=-a*c,t[2]=g-d*l,t[6]=m+f*l,t[10]=o*c}else if(e.order==="YXZ"){let d=c*h,f=c*u,m=l*h,g=l*u;t[0]=d+g*a,t[4]=m*a-f,t[8]=o*l,t[1]=o*u,t[5]=o*h,t[9]=-a,t[2]=f*a-m,t[6]=g+d*a,t[10]=o*c}else if(e.order==="ZXY"){let d=c*h,f=c*u,m=l*h,g=l*u;t[0]=d-g*a,t[4]=-o*u,t[8]=m+f*a,t[1]=f+m*a,t[5]=o*h,t[9]=g-d*a,t[2]=-o*l,t[6]=a,t[10]=o*c}else if(e.order==="ZYX"){let d=o*h,f=o*u,m=a*h,g=a*u;t[0]=c*h,t[4]=m*l-f,t[8]=d*l+g,t[1]=c*u,t[5]=g*l+d,t[9]=f*l-m,t[2]=-l,t[6]=a*c,t[10]=o*c}else if(e.order==="YZX"){let d=o*c,f=o*l,m=a*c,g=a*l;t[0]=c*h,t[4]=g-d*u,t[8]=m*u+f,t[1]=u,t[5]=o*h,t[9]=-a*h,t[2]=-l*h,t[6]=f*u+m,t[10]=d-g*u}else if(e.order==="XZY"){let d=o*c,f=o*l,m=a*c,g=a*l;t[0]=c*h,t[4]=-u,t[8]=l*h,t[1]=d*u+g,t[5]=o*h,t[9]=f*u-m,t[2]=m*u-f,t[6]=a*h,t[10]=g*u+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(cm,e,lm)}lookAt(e,t,n){let s=this.elements;return un.subVectors(e,t),un.lengthSq()===0&&(un.z=1),un.normalize(),Ii.crossVectors(n,un),Ii.lengthSq()===0&&(Math.abs(n.z)===1?un.x+=1e-4:un.z+=1e-4,un.normalize(),Ii.crossVectors(n,un)),Ii.normalize(),Wo.crossVectors(un,Ii),s[0]=Ii.x,s[4]=Wo.x,s[8]=un.x,s[1]=Ii.y,s[5]=Wo.y,s[9]=un.y,s[2]=Ii.z,s[6]=Wo.z,s[10]=un.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){let n=e.elements,s=t.elements,r=this.elements,o=n[0],a=n[4],c=n[8],l=n[12],h=n[1],u=n[5],d=n[9],f=n[13],m=n[2],g=n[6],p=n[10],A=n[14],I=n[3],C=n[7],E=n[11],w=n[15],v=s[0],T=s[4],F=s[8],M=s[12],x=s[1],R=s[5],G=s[9],N=s[13],H=s[2],Y=s[6],z=s[10],J=s[14],k=s[3],te=s[7],le=s[11],ge=s[15];return r[0]=o*v+a*x+c*H+l*k,r[4]=o*T+a*R+c*Y+l*te,r[8]=o*F+a*G+c*z+l*le,r[12]=o*M+a*N+c*J+l*ge,r[1]=h*v+u*x+d*H+f*k,r[5]=h*T+u*R+d*Y+f*te,r[9]=h*F+u*G+d*z+f*le,r[13]=h*M+u*N+d*J+f*ge,r[2]=m*v+g*x+p*H+A*k,r[6]=m*T+g*R+p*Y+A*te,r[10]=m*F+g*G+p*z+A*le,r[14]=m*M+g*N+p*J+A*ge,r[3]=I*v+C*x+E*H+w*k,r[7]=I*T+C*R+E*Y+w*te,r[11]=I*F+C*G+E*z+w*le,r[15]=I*M+C*N+E*J+w*ge,this}multiplyScalar(e){let t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){let e=this.elements,t=e[0],n=e[4],s=e[8],r=e[12],o=e[1],a=e[5],c=e[9],l=e[13],h=e[2],u=e[6],d=e[10],f=e[14],m=e[3],g=e[7],p=e[11],A=e[15];return m*(+r*c*u-s*l*u-r*a*d+n*l*d+s*a*f-n*c*f)+g*(+t*c*f-t*l*d+r*o*d-s*o*f+s*l*h-r*c*h)+p*(+t*l*u-t*a*f-r*o*u+n*o*f+r*a*h-n*l*h)+A*(-s*a*h-t*c*u+t*a*d+s*o*u-n*o*d+n*c*h)}transpose(){let e=this.elements,t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){let s=this.elements;return e.isVector3?(s[12]=e.x,s[13]=e.y,s[14]=e.z):(s[12]=e,s[13]=t,s[14]=n),this}invert(){let e=this.elements,t=e[0],n=e[1],s=e[2],r=e[3],o=e[4],a=e[5],c=e[6],l=e[7],h=e[8],u=e[9],d=e[10],f=e[11],m=e[12],g=e[13],p=e[14],A=e[15],I=u*p*l-g*d*l+g*c*f-a*p*f-u*c*A+a*d*A,C=m*d*l-h*p*l-m*c*f+o*p*f+h*c*A-o*d*A,E=h*g*l-m*u*l+m*a*f-o*g*f-h*a*A+o*u*A,w=m*u*c-h*g*c-m*a*d+o*g*d+h*a*p-o*u*p,v=t*I+n*C+s*E+r*w;if(v===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let T=1/v;return e[0]=I*T,e[1]=(g*d*r-u*p*r-g*s*f+n*p*f+u*s*A-n*d*A)*T,e[2]=(a*p*r-g*c*r+g*s*l-n*p*l-a*s*A+n*c*A)*T,e[3]=(u*c*r-a*d*r-u*s*l+n*d*l+a*s*f-n*c*f)*T,e[4]=C*T,e[5]=(h*p*r-m*d*r+m*s*f-t*p*f-h*s*A+t*d*A)*T,e[6]=(m*c*r-o*p*r-m*s*l+t*p*l+o*s*A-t*c*A)*T,e[7]=(o*d*r-h*c*r+h*s*l-t*d*l-o*s*f+t*c*f)*T,e[8]=E*T,e[9]=(m*u*r-h*g*r-m*n*f+t*g*f+h*n*A-t*u*A)*T,e[10]=(o*g*r-m*a*r+m*n*l-t*g*l-o*n*A+t*a*A)*T,e[11]=(h*a*r-o*u*r-h*n*l+t*u*l+o*n*f-t*a*f)*T,e[12]=w*T,e[13]=(h*g*s-m*u*s+m*n*d-t*g*d-h*n*p+t*u*p)*T,e[14]=(m*a*s-o*g*s-m*n*c+t*g*c+o*n*p-t*a*p)*T,e[15]=(o*u*s-h*a*s+h*n*c-t*u*c-o*n*d+t*a*d)*T,this}scale(e){let t=this.elements,n=e.x,s=e.y,r=e.z;return t[0]*=n,t[4]*=s,t[8]*=r,t[1]*=n,t[5]*=s,t[9]*=r,t[2]*=n,t[6]*=s,t[10]*=r,t[3]*=n,t[7]*=s,t[11]*=r,this}getMaxScaleOnAxis(){let e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],s=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,s))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){let t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){let t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){let n=Math.cos(t),s=Math.sin(t),r=1-n,o=e.x,a=e.y,c=e.z,l=r*o,h=r*a;return this.set(l*o+n,l*a-s*c,l*c+s*a,0,l*a+s*c,h*a+n,h*c-s*o,0,l*c-s*a,h*c+s*o,r*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,s,r,o){return this.set(1,n,r,0,e,1,o,0,t,s,1,0,0,0,0,1),this}compose(e,t,n){let s=this.elements,r=t._x,o=t._y,a=t._z,c=t._w,l=r+r,h=o+o,u=a+a,d=r*l,f=r*h,m=r*u,g=o*h,p=o*u,A=a*u,I=c*l,C=c*h,E=c*u,w=n.x,v=n.y,T=n.z;return s[0]=(1-(g+A))*w,s[1]=(f+E)*w,s[2]=(m-C)*w,s[3]=0,s[4]=(f-E)*v,s[5]=(1-(d+A))*v,s[6]=(p+I)*v,s[7]=0,s[8]=(m+C)*T,s[9]=(p-I)*T,s[10]=(1-(d+g))*T,s[11]=0,s[12]=e.x,s[13]=e.y,s[14]=e.z,s[15]=1,this}decompose(e,t,n){let s=this.elements,r=Gs.set(s[0],s[1],s[2]).length(),o=Gs.set(s[4],s[5],s[6]).length(),a=Gs.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),e.x=s[12],e.y=s[13],e.z=s[14],Bn.copy(this);let l=1/r,h=1/o,u=1/a;return Bn.elements[0]*=l,Bn.elements[1]*=l,Bn.elements[2]*=l,Bn.elements[4]*=h,Bn.elements[5]*=h,Bn.elements[6]*=h,Bn.elements[8]*=u,Bn.elements[9]*=u,Bn.elements[10]*=u,t.setFromRotationMatrix(Bn),n.x=r,n.y=o,n.z=a,this}makePerspective(e,t,n,s,r,o,a=kn){let c=this.elements,l=2*r/(t-e),h=2*r/(n-s),u=(t+e)/(t-e),d=(n+s)/(n-s),f,m;if(a===kn)f=-(o+r)/(o-r),m=-2*o*r/(o-r);else if(a===zr)f=-o/(o-r),m=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return c[0]=l,c[4]=0,c[8]=u,c[12]=0,c[1]=0,c[5]=h,c[9]=d,c[13]=0,c[2]=0,c[6]=0,c[10]=f,c[14]=m,c[3]=0,c[7]=0,c[11]=-1,c[15]=0,this}makeOrthographic(e,t,n,s,r,o,a=kn){let c=this.elements,l=1/(t-e),h=1/(n-s),u=1/(o-r),d=(t+e)*l,f=(n+s)*h,m,g;if(a===kn)m=(o+r)*u,g=-2*u;else if(a===zr)m=r*u,g=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return c[0]=2*l,c[4]=0,c[8]=0,c[12]=-d,c[1]=0,c[5]=2*h,c[9]=0,c[13]=-f,c[2]=0,c[6]=0,c[10]=g,c[14]=-m,c[3]=0,c[7]=0,c[11]=0,c[15]=1,this}equals(e){let t=this.elements,n=e.elements;for(let s=0;s<16;s++)if(t[s]!==n[s])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){let n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}},Gs=new b,Bn=new Pe,cm=new b(0,0,0),lm=new b(1,1,1),Ii=new b,Wo=new b,un=new b,$u=new Pe,ed=new jt,Un=class i{constructor(e=0,t=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=s}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,s=this._order){return this._x=e,this._y=t,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){let s=e.elements,r=s[0],o=s[4],a=s[8],c=s[1],l=s[5],h=s[9],u=s[2],d=s[6],f=s[10];switch(t){case"XYZ":this._y=Math.asin(Oe(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,f),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(d,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Oe(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,f),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(Oe(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-u,f),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-Oe(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(d,f),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(Oe(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(a,f));break;case"XZY":this._z=Math.asin(-Oe(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(d,l),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,f),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return $u.makeRotationFromQuaternion(e),this.setFromRotationMatrix($u,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return ed.setFromEuler(this),this.setFromQuaternion(ed,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};Un.DEFAULT_ORDER="XYZ";var Xr=class{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}},hm=0,td=new b,Hs=new jt,ni=new Pe,Ko=new b,Ur=new b,um=new b,dm=new jt,nd=new b(1,0,0),id=new b(0,1,0),sd=new b(0,0,1),rd={type:"added"},fm={type:"removed"},Vs={type:"childadded",child:null},nl={type:"childremoved",child:null},ut=class i extends Gn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:hm++}),this.uuid=Pn(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let e=new b,t=new Un,n=new jt,s=new b(1,1,1);function r(){n.setFromEuler(t,!1)}function o(){t.setFromQuaternion(n,void 0,!1)}t._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new Pe},normalMatrix:{value:new Le}}),this.matrix=new Pe,this.matrixWorld=new Pe,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Xr,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return Hs.setFromAxisAngle(e,t),this.quaternion.multiply(Hs),this}rotateOnWorldAxis(e,t){return Hs.setFromAxisAngle(e,t),this.quaternion.premultiply(Hs),this}rotateX(e){return this.rotateOnAxis(nd,e)}rotateY(e){return this.rotateOnAxis(id,e)}rotateZ(e){return this.rotateOnAxis(sd,e)}translateOnAxis(e,t){return td.copy(e).applyQuaternion(this.quaternion),this.position.add(td.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(nd,e)}translateY(e){return this.translateOnAxis(id,e)}translateZ(e){return this.translateOnAxis(sd,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(ni.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?Ko.copy(e):Ko.set(e,t,n);let s=this.parent;this.updateWorldMatrix(!0,!1),Ur.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ni.lookAt(Ur,Ko,this.up):ni.lookAt(Ko,Ur,this.up),this.quaternion.setFromRotationMatrix(ni),s&&(ni.extractRotation(s.matrixWorld),Hs.setFromRotationMatrix(ni),this.quaternion.premultiply(Hs.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(rd),Vs.child=e,this.dispatchEvent(Vs),Vs.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(fm),nl.child=e,this.dispatchEvent(nl),nl.child=null),this}removeFromParent(){let e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),ni.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),ni.multiply(e.parent.matrixWorld)),e.applyMatrix4(ni),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(rd),Vs.child=e,this.dispatchEvent(Vs),Vs.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,s=this.children.length;n<s;n++){let o=this.children[n].getObjectByProperty(e,t);if(o!==void 0)return o}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ur,e,um),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Ur,dm,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);let t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(e){e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].traverseVisible(e)}traverseAncestors(e){let t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);let t=this.children;for(let n=0,s=t.length;n<s;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t){let n=this.parent;if(e===!0&&n!==null&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),t===!0){let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].updateWorldMatrix(!1,!0)}}toJSON(e){let t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(a=>({boxInitialized:a.boxInitialized,boxMin:a.box.min.toArray(),boxMax:a.box.max.toArray(),sphereInitialized:a.sphereInitialized,sphereRadius:a.sphere.radius,sphereCenter:a.sphere.center.toArray()})),s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(e),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(e.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let c=a.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){let u=c[l];r(e.shapes,u)}else r(e.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(e.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(r(e.materials,this.material[c]));s.material=a}else s.material=r(e.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(e).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let c=this.animations[a];s.animations.push(r(e.animations,c))}}if(t){let a=o(e.geometries),c=o(e.materials),l=o(e.textures),h=o(e.images),u=o(e.shapes),d=o(e.skeletons),f=o(e.animations),m=o(e.nodes);a.length>0&&(n.geometries=a),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),d.length>0&&(n.skeletons=d),f.length>0&&(n.animations=f),m.length>0&&(n.nodes=m)}return n.object=s,n;function o(a){let c=[];for(let l in a){let h=a[l];delete h.metadata,c.push(h)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){let s=e.children[n];this.add(s.clone())}return this}};ut.DEFAULT_UP=new b(0,1,0);ut.DEFAULT_MATRIX_AUTO_UPDATE=!0;ut.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var Rn=new b,ii=new b,il=new b,si=new b,zs=new b,Ws=new b,od=new b,sl=new b,rl=new b,ol=new b,al=new je,cl=new je,ll=new je,Ti=class i{constructor(e=new b,t=new b,n=new b){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,s){s.subVectors(n,t),Rn.subVectors(e,t),s.cross(Rn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(e,t,n,s,r){Rn.subVectors(s,t),ii.subVectors(n,t),il.subVectors(e,t);let o=Rn.dot(Rn),a=Rn.dot(ii),c=Rn.dot(il),l=ii.dot(ii),h=ii.dot(il),u=o*l-a*a;if(u===0)return r.set(0,0,0),null;let d=1/u,f=(l*c-a*h)*d,m=(o*h-a*c)*d;return r.set(1-f-m,m,f)}static containsPoint(e,t,n,s){return this.getBarycoord(e,t,n,s,si)===null?!1:si.x>=0&&si.y>=0&&si.x+si.y<=1}static getInterpolation(e,t,n,s,r,o,a,c){return this.getBarycoord(e,t,n,s,si)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,si.x),c.addScaledVector(o,si.y),c.addScaledVector(a,si.z),c)}static getInterpolatedAttribute(e,t,n,s,r,o){return al.setScalar(0),cl.setScalar(0),ll.setScalar(0),al.fromBufferAttribute(e,t),cl.fromBufferAttribute(e,n),ll.fromBufferAttribute(e,s),o.setScalar(0),o.addScaledVector(al,r.x),o.addScaledVector(cl,r.y),o.addScaledVector(ll,r.z),o}static isFrontFacing(e,t,n,s){return Rn.subVectors(n,t),ii.subVectors(e,t),Rn.cross(ii).dot(s)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,s){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[s]),this}setFromAttributeAndIndices(e,t,n,s){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,s),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return Rn.subVectors(this.c,this.b),ii.subVectors(this.a,this.b),Rn.cross(ii).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return i.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return i.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,s,r){return i.getInterpolation(e,this.a,this.b,this.c,t,n,s,r)}containsPoint(e){return i.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return i.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){let n=this.a,s=this.b,r=this.c,o,a;zs.subVectors(s,n),Ws.subVectors(r,n),sl.subVectors(e,n);let c=zs.dot(sl),l=Ws.dot(sl);if(c<=0&&l<=0)return t.copy(n);rl.subVectors(e,s);let h=zs.dot(rl),u=Ws.dot(rl);if(h>=0&&u<=h)return t.copy(s);let d=c*u-h*l;if(d<=0&&c>=0&&h<=0)return o=c/(c-h),t.copy(n).addScaledVector(zs,o);ol.subVectors(e,r);let f=zs.dot(ol),m=Ws.dot(ol);if(m>=0&&f<=m)return t.copy(r);let g=f*l-c*m;if(g<=0&&l>=0&&m<=0)return a=l/(l-m),t.copy(n).addScaledVector(Ws,a);let p=h*m-f*u;if(p<=0&&u-h>=0&&f-m>=0)return od.subVectors(r,s),a=(u-h)/(u-h+(f-m)),t.copy(s).addScaledVector(od,a);let A=1/(p+g+d);return o=g*A,a=d*A,t.copy(n).addScaledVector(zs,o).addScaledVector(Ws,a)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}},xf={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Si={h:0,s:0,l:0},Xo={h:0,s:0,l:0};function hl(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}var Ee=class{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){let s=e;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=et){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Qe.toWorkingColorSpace(this,t),this}setRGB(e,t,n,s=Qe.workingColorSpace){return this.r=e,this.g=t,this.b=n,Qe.toWorkingColorSpace(this,s),this}setHSL(e,t,n,s=Qe.workingColorSpace){if(e=Yl(e,1),t=Oe(t,0,1),n=Oe(n,0,1),t===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+t):n+t-n*t,o=2*n-r;this.r=hl(o,r,e+1/3),this.g=hl(o,r,e),this.b=hl(o,r,e-1/3)}return Qe.toWorkingColorSpace(this,s),this}setStyle(e,t=et){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+e+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(e)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,t);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,t);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+e)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(e)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(r,16),t);console.warn("THREE.Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=et){let n=xf[e.toLowerCase()];return n!==void 0?this.setHex(n,t):console.warn("THREE.Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=ai(e.r),this.g=ai(e.g),this.b=ai(e.b),this}copyLinearToSRGB(e){return this.r=Js(e.r),this.g=Js(e.g),this.b=Js(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=et){return Qe.fromWorkingColorSpace(kt.copy(this),e),Math.round(Oe(kt.r*255,0,255))*65536+Math.round(Oe(kt.g*255,0,255))*256+Math.round(Oe(kt.b*255,0,255))}getHexString(e=et){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Qe.workingColorSpace){Qe.fromWorkingColorSpace(kt.copy(this),t);let n=kt.r,s=kt.g,r=kt.b,o=Math.max(n,s,r),a=Math.min(n,s,r),c,l,h=(a+o)/2;if(a===o)c=0,l=0;else{let u=o-a;switch(l=h<=.5?u/(o+a):u/(2-o-a),o){case n:c=(s-r)/u+(s<r?6:0);break;case s:c=(r-n)/u+2;break;case r:c=(n-s)/u+4;break}c/=6}return e.h=c,e.s=l,e.l=h,e}getRGB(e,t=Qe.workingColorSpace){return Qe.fromWorkingColorSpace(kt.copy(this),t),e.r=kt.r,e.g=kt.g,e.b=kt.b,e}getStyle(e=et){Qe.fromWorkingColorSpace(kt.copy(this),e);let t=kt.r,n=kt.g,s=kt.b;return e!==et?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(e,t,n){return this.getHSL(Si),this.setHSL(Si.h+e,Si.s+t,Si.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Si),e.getHSL(Xo);let n=Vr(Si.h,Xo.h,t),s=Vr(Si.s,Xo.s,t),r=Vr(Si.l,Xo.l,t);return this.setHSL(n,s,r),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){let t=this.r,n=this.g,s=this.b,r=e.elements;return this.r=r[0]*t+r[3]*n+r[6]*s,this.g=r[1]*t+r[4]*n+r[7]*s,this.b=r[2]*t+r[5]*n+r[8]*s,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},kt=new Ee;Ee.NAMES=xf;var Am=0,$t=class extends Gn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Am++}),this.uuid=Pn(),this.name="",this.type="Material",this.blending=ji,this.side=Fn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ua,this.blendDst=da,this.blendEquation=wi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Ee(0,0,0),this.blendAlpha=0,this.depthFunc=$i,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Ml,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Ji,this.stencilZFail=Ji,this.stencilZPass=Ji,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(let t in e){let n=e[t];if(n===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}let s=this[t];if(s===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[t]=n}}toJSON(e){let t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==ji&&(n.blending=this.blending),this.side!==Fn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==ua&&(n.blendSrc=this.blendSrc),this.blendDst!==da&&(n.blendDst=this.blendDst),this.blendEquation!==wi&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==$i&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Ml&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Ji&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Ji&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Ji&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let o=[];for(let a in r){let c=r[a];delete c.metadata,o.push(c)}return o}if(t){let r=s(e.textures),o=s(e.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;let t=e.clippingPlanes,n=null;if(t!==null){let s=t.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=t[r].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}onBuild(){console.warn("Material: onBuild() has been removed.")}},en=class extends $t{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Ee(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Un,this.combine=Fl,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}};var Ct=new b,qo=new ve,pt=class{constructor(e,t,n=!1){if(Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=fa,this.updateRanges=[],this.gpuType=Dt,this.version=0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[e+s]=t.array[n+s];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)qo.fromBufferAttribute(this,t),qo.applyMatrix3(e),this.setXY(t,qo.x,qo.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)Ct.fromBufferAttribute(this,t),Ct.applyMatrix3(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)Ct.fromBufferAttribute(this,t),Ct.applyMatrix4(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Ct.fromBufferAttribute(this,t),Ct.applyNormalMatrix(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Ct.fromBufferAttribute(this,t),Ct.transformDirection(e),this.setXYZ(t,Ct.x,Ct.y,Ct.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=Dn(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=rt(n,this.array)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=Dn(t,this.array)),t}setX(e,t){return this.normalized&&(t=rt(t,this.array)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=Dn(t,this.array)),t}setY(e,t){return this.normalized&&(t=rt(t,this.array)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=Dn(t,this.array)),t}setZ(e,t){return this.normalized&&(t=rt(t,this.array)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=Dn(t,this.array)),t}setW(e,t){return this.normalized&&(t=rt(t,this.array)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=rt(t,this.array),n=rt(n,this.array)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,s){return e*=this.itemSize,this.normalized&&(t=rt(t,this.array),n=rt(n,this.array),s=rt(s,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e*=this.itemSize,this.normalized&&(t=rt(t,this.array),n=rt(n,this.array),s=rt(s,this.array),r=rt(r,this.array)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=s,this.array[e+3]=r,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(e.name=this.name),this.usage!==fa&&(e.usage=this.usage),e}};var qr=class extends pt{constructor(e,t,n){super(new Uint16Array(e),t,n)}};var Yr=class extends pt{constructor(e,t,n){super(new Uint32Array(e),t,n)}};var Gt=class extends pt{constructor(e,t,n){super(new Float32Array(e),t,n)}},pm=0,yn=new Pe,ul=new ut,Ks=new b,dn=new Ft,Nr=new Ft,Rt=new b,Ht=class i extends Gn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:pm++}),this.uuid=Pn(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(Jl(e)?Yr:qr)(e,1):this.index=e,this}setIndirect(e){return this.indirect=e,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){let t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Le().getNormalMatrix(e);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(e),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(e){return yn.makeRotationFromQuaternion(e),this.applyMatrix4(yn),this}rotateX(e){return yn.makeRotationX(e),this.applyMatrix4(yn),this}rotateY(e){return yn.makeRotationY(e),this.applyMatrix4(yn),this}rotateZ(e){return yn.makeRotationZ(e),this.applyMatrix4(yn),this}translate(e,t,n){return yn.makeTranslation(e,t,n),this.applyMatrix4(yn),this}scale(e,t,n){return yn.makeScale(e,t,n),this.applyMatrix4(yn),this}lookAt(e){return ul.lookAt(e),ul.updateMatrix(),this.applyMatrix4(ul.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Ks).negate(),this.translate(Ks.x,Ks.y,Ks.z),this}setFromPoints(e){let t=this.getAttribute("position");if(t===void 0){let n=[];for(let s=0,r=e.length;s<r;s++){let o=e[s];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new Gt(n,3))}else{let n=Math.min(e.length,t.count);for(let s=0;s<n;s++){let r=e[s];t.setXYZ(s,r.x,r.y,r.z||0)}e.length>t.count&&console.warn("THREE.BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ft);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new b(-1/0,-1/0,-1/0),new b(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,s=t.length;n<s;n++){let r=t[n];dn.setFromBufferAttribute(r),this.morphTargetsRelative?(Rt.addVectors(this.boundingBox.min,dn.min),this.boundingBox.expandByPoint(Rt),Rt.addVectors(this.boundingBox.max,dn.max),this.boundingBox.expandByPoint(Rt)):(this.boundingBox.expandByPoint(dn.min),this.boundingBox.expandByPoint(dn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new sn);let e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new b,1/0);return}if(e){let n=this.boundingSphere.center;if(dn.setFromBufferAttribute(e),t)for(let r=0,o=t.length;r<o;r++){let a=t[r];Nr.setFromBufferAttribute(a),this.morphTargetsRelative?(Rt.addVectors(dn.min,Nr.min),dn.expandByPoint(Rt),Rt.addVectors(dn.max,Nr.max),dn.expandByPoint(Rt)):(dn.expandByPoint(Nr.min),dn.expandByPoint(Nr.max))}dn.getCenter(n);let s=0;for(let r=0,o=e.count;r<o;r++)Rt.fromBufferAttribute(e,r),s=Math.max(s,n.distanceToSquared(Rt));if(t)for(let r=0,o=t.length;r<o;r++){let a=t[r],c=this.morphTargetsRelative;for(let l=0,h=a.count;l<h;l++)Rt.fromBufferAttribute(a,l),c&&(Ks.fromBufferAttribute(e,l),Rt.add(Ks)),s=Math.max(s,n.distanceToSquared(Rt))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=t.position,s=t.normal,r=t.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new pt(new Float32Array(4*n.count),4));let o=this.getAttribute("tangent"),a=[],c=[];for(let F=0;F<n.count;F++)a[F]=new b,c[F]=new b;let l=new b,h=new b,u=new b,d=new ve,f=new ve,m=new ve,g=new b,p=new b;function A(F,M,x){l.fromBufferAttribute(n,F),h.fromBufferAttribute(n,M),u.fromBufferAttribute(n,x),d.fromBufferAttribute(r,F),f.fromBufferAttribute(r,M),m.fromBufferAttribute(r,x),h.sub(l),u.sub(l),f.sub(d),m.sub(d);let R=1/(f.x*m.y-m.x*f.y);isFinite(R)&&(g.copy(h).multiplyScalar(m.y).addScaledVector(u,-f.y).multiplyScalar(R),p.copy(u).multiplyScalar(f.x).addScaledVector(h,-m.x).multiplyScalar(R),a[F].add(g),a[M].add(g),a[x].add(g),c[F].add(p),c[M].add(p),c[x].add(p))}let I=this.groups;I.length===0&&(I=[{start:0,count:e.count}]);for(let F=0,M=I.length;F<M;++F){let x=I[F],R=x.start,G=x.count;for(let N=R,H=R+G;N<H;N+=3)A(e.getX(N+0),e.getX(N+1),e.getX(N+2))}let C=new b,E=new b,w=new b,v=new b;function T(F){w.fromBufferAttribute(s,F),v.copy(w);let M=a[F];C.copy(M),C.sub(w.multiplyScalar(w.dot(M))).normalize(),E.crossVectors(v,M);let R=E.dot(c[F])<0?-1:1;o.setXYZW(F,C.x,C.y,C.z,R)}for(let F=0,M=I.length;F<M;++F){let x=I[F],R=x.start,G=x.count;for(let N=R,H=R+G;N<H;N+=3)T(e.getX(N+0)),T(e.getX(N+1)),T(e.getX(N+2))}}computeVertexNormals(){let e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new pt(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,f=n.count;d<f;d++)n.setXYZ(d,0,0,0);let s=new b,r=new b,o=new b,a=new b,c=new b,l=new b,h=new b,u=new b;if(e)for(let d=0,f=e.count;d<f;d+=3){let m=e.getX(d+0),g=e.getX(d+1),p=e.getX(d+2);s.fromBufferAttribute(t,m),r.fromBufferAttribute(t,g),o.fromBufferAttribute(t,p),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),a.fromBufferAttribute(n,m),c.fromBufferAttribute(n,g),l.fromBufferAttribute(n,p),a.add(h),c.add(h),l.add(h),n.setXYZ(m,a.x,a.y,a.z),n.setXYZ(g,c.x,c.y,c.z),n.setXYZ(p,l.x,l.y,l.z)}else for(let d=0,f=t.count;d<f;d+=3)s.fromBufferAttribute(t,d+0),r.fromBufferAttribute(t,d+1),o.fromBufferAttribute(t,d+2),h.subVectors(o,r),u.subVectors(s,r),h.cross(u),n.setXYZ(d+0,h.x,h.y,h.z),n.setXYZ(d+1,h.x,h.y,h.z),n.setXYZ(d+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Rt.fromBufferAttribute(e,t),Rt.normalize(),e.setXYZ(t,Rt.x,Rt.y,Rt.z)}toNonIndexed(){function e(a,c){let l=a.array,h=a.itemSize,u=a.normalized,d=new l.constructor(c.length*h),f=0,m=0;for(let g=0,p=c.length;g<p;g++){a.isInterleavedBufferAttribute?f=c[g]*a.data.stride+a.offset:f=c[g]*h;for(let A=0;A<h;A++)d[m++]=l[f++]}return new pt(d,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let t=new i,n=this.index.array,s=this.attributes;for(let a in s){let c=s[a],l=e(c,n);t.setAttribute(a,l)}let r=this.morphAttributes;for(let a in r){let c=[],l=r[a];for(let h=0,u=l.length;h<u;h++){let d=l[h],f=e(d,n);c.push(f)}t.morphAttributes[a]=c}t.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,c=o.length;a<c;a++){let l=o[a];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){let e={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0){let c=this.parameters;for(let l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};let t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});let n=this.attributes;for(let c in n){let l=n[c];e.data.attributes[c]=l.toJSON(e.data)}let s={},r=!1;for(let c in this.morphAttributes){let l=this.morphAttributes[c],h=[];for(let u=0,d=l.length;u<d;u++){let f=l[u];h.push(f.toJSON(e.data))}h.length>0&&(s[c]=h,r=!0)}r&&(e.data.morphAttributes=s,e.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(e.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(e.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let t={};this.name=e.name;let n=e.index;n!==null&&this.setIndex(n.clone(t));let s=e.attributes;for(let l in s){let h=s[l];this.setAttribute(l,h.clone(t))}let r=e.morphAttributes;for(let l in r){let h=[],u=r[l];for(let d=0,f=u.length;d<f;d++)h.push(u[d].clone(t));this.morphAttributes[l]=h}this.morphTargetsRelative=e.morphTargetsRelative;let o=e.groups;for(let l=0,h=o.length;l<h;l++){let u=o[l];this.addGroup(u.start,u.count,u.materialIndex)}let a=e.boundingBox;a!==null&&(this.boundingBox=a.clone());let c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},ad=new Pe,qi=new ci,Yo=new sn,cd=new b,Jo=new b,Zo=new b,jo=new b,dl=new b,$o=new b,ld=new b,ea=new b,Xe=class extends ut{constructor(e=new Ht,t=new en){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=e.morphTargetInfluences.slice()),e.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary)),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(e,t){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;t.fromBufferAttribute(s,e);let a=this.morphTargetInfluences;if(r&&a){$o.set(0,0,0);for(let c=0,l=r.length;c<l;c++){let h=a[c],u=r[c];h!==0&&(dl.fromBufferAttribute(u,e),o?$o.addScaledVector(dl,h):$o.addScaledVector(dl.sub(t),h))}t.add($o)}return t}raycast(e,t){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Yo.copy(n.boundingSphere),Yo.applyMatrix4(r),qi.copy(e.ray).recast(e.near),!(Yo.containsPoint(qi.origin)===!1&&(qi.intersectSphere(Yo,cd)===null||qi.origin.distanceToSquared(cd)>(e.far-e.near)**2))&&(ad.copy(r).invert(),qi.copy(e.ray).applyMatrix4(ad),!(n.boundingBox!==null&&qi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,qi)))}_computeIntersections(e,t,n){let s,r=this.geometry,o=this.material,a=r.index,c=r.attributes.position,l=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,d=r.groups,f=r.drawRange;if(a!==null)if(Array.isArray(o))for(let m=0,g=d.length;m<g;m++){let p=d[m],A=o[p.materialIndex],I=Math.max(p.start,f.start),C=Math.min(a.count,Math.min(p.start+p.count,f.start+f.count));for(let E=I,w=C;E<w;E+=3){let v=a.getX(E),T=a.getX(E+1),F=a.getX(E+2);s=ta(this,A,e,n,l,h,u,v,T,F),s&&(s.faceIndex=Math.floor(E/3),s.face.materialIndex=p.materialIndex,t.push(s))}}else{let m=Math.max(0,f.start),g=Math.min(a.count,f.start+f.count);for(let p=m,A=g;p<A;p+=3){let I=a.getX(p),C=a.getX(p+1),E=a.getX(p+2);s=ta(this,o,e,n,l,h,u,I,C,E),s&&(s.faceIndex=Math.floor(p/3),t.push(s))}}else if(c!==void 0)if(Array.isArray(o))for(let m=0,g=d.length;m<g;m++){let p=d[m],A=o[p.materialIndex],I=Math.max(p.start,f.start),C=Math.min(c.count,Math.min(p.start+p.count,f.start+f.count));for(let E=I,w=C;E<w;E+=3){let v=E,T=E+1,F=E+2;s=ta(this,A,e,n,l,h,u,v,T,F),s&&(s.faceIndex=Math.floor(E/3),s.face.materialIndex=p.materialIndex,t.push(s))}}else{let m=Math.max(0,f.start),g=Math.min(c.count,f.start+f.count);for(let p=m,A=g;p<A;p+=3){let I=p,C=p+1,E=p+2;s=ta(this,o,e,n,l,h,u,I,C,E),s&&(s.faceIndex=Math.floor(p/3),t.push(s))}}}};function mm(i,e,t,n,s,r,o,a){let c;if(e.side===Ut?c=n.intersectTriangle(o,r,s,!0,a):c=n.intersectTriangle(s,r,o,e.side===Fn,a),c===null)return null;ea.copy(a),ea.applyMatrix4(i.matrixWorld);let l=t.ray.origin.distanceTo(ea);return l<t.near||l>t.far?null:{distance:l,point:ea.clone(),object:i}}function ta(i,e,t,n,s,r,o,a,c,l){i.getVertexPosition(a,Jo),i.getVertexPosition(c,Zo),i.getVertexPosition(l,jo);let h=mm(i,e,t,n,Jo,Zo,jo,ld);if(h){let u=new b;Ti.getBarycoord(ld,Jo,Zo,jo,u),s&&(h.uv=Ti.getInterpolatedAttribute(s,a,c,l,u,new ve)),r&&(h.uv1=Ti.getInterpolatedAttribute(r,a,c,l,u,new ve)),o&&(h.normal=Ti.getInterpolatedAttribute(o,a,c,l,u,new b),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let d={a,b:c,c:l,normal:new b,materialIndex:0};Ti.getNormal(Jo,Zo,jo,d.normal),h.face=d,h.barycoord=u}return h}var Bi=class i extends Ht{constructor(e=1,t=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let c=[],l=[],h=[],u=[],d=0,f=0;m("z","y","x",-1,-1,n,t,e,o,r,0),m("z","y","x",1,-1,n,t,-e,o,r,1),m("x","z","y",1,1,e,n,t,s,o,2),m("x","z","y",1,-1,e,n,-t,s,o,3),m("x","y","z",1,-1,e,t,n,s,r,4),m("x","y","z",-1,-1,e,t,-n,s,r,5),this.setIndex(c),this.setAttribute("position",new Gt(l,3)),this.setAttribute("normal",new Gt(h,3)),this.setAttribute("uv",new Gt(u,2));function m(g,p,A,I,C,E,w,v,T,F,M){let x=E/T,R=w/F,G=E/2,N=w/2,H=v/2,Y=T+1,z=F+1,J=0,k=0,te=new b;for(let le=0;le<z;le++){let ge=le*R-N;for(let Be=0;Be<Y;Be++){let Ve=Be*x-G;te[g]=Ve*I,te[p]=ge*C,te[A]=H,l.push(te.x,te.y,te.z),te[g]=0,te[p]=0,te[A]=v>0?1:-1,h.push(te.x,te.y,te.z),u.push(Be/T),u.push(1-le/F),J+=1}}for(let le=0;le<F;le++)for(let ge=0;ge<T;ge++){let Be=d+ge+Y*le,Ve=d+ge+Y*(le+1),W=d+(ge+1)+Y*(le+1),ie=d+(ge+1)+Y*le;c.push(Be,Ve,ie),c.push(Ve,W,ie),k+=6}a.addGroup(f,k,M),f+=k,d+=J}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}};function xs(i){let e={};for(let t in i){e[t]={};for(let n in i[t]){let s=i[t][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=s.clone():Array.isArray(s)?e[t][n]=s.slice():e[t][n]=s}}return e}function Vt(i){let e={};for(let t=0;t<i.length;t++){let n=xs(i[t]);for(let s in n)e[s]=n[s]}return e}function gm(i){let e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function Zl(i){let e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Qe.workingColorSpace}var Cf={clone:xs,merge:Vt},_m=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Em=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Nn=class extends $t{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=_m,this.fragmentShader=Em,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=xs(e.uniforms),this.uniformsGroups=gm(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this}toJSON(e){let t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?t.uniforms[s]={type:"t",value:o.toJSON(e).uuid}:o&&o.isColor?t.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[s]={type:"m4",value:o.toArray()}:t.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}},Jr=class extends ut{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new Pe,this.projectionMatrix=new Pe,this.projectionMatrixInverse=new Pe,this.coordinateSystem=kn}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(e,t){super.updateWorldMatrix(e,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},vi=new b,hd=new ve,ud=new ve,Mt=class extends Jr{constructor(e=50,t=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){let t=.5*this.getFilmHeight()/e;this.fov=is*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){let e=Math.tan(Hr*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return is*2*Math.atan(Math.tan(Hr*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){vi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(vi.x,vi.y).multiplyScalar(-e/vi.z),vi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(vi.x,vi.y).multiplyScalar(-e/vi.z)}getViewSize(e,t){return this.getViewBounds(e,hd,ud),t.subVectors(ud,hd)}setViewOffset(e,t,n,s,r,o){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=this.near,t=e*Math.tan(Hr*.5*this.fov)/this.zoom,n=2*t,s=this.aspect*n,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let c=o.fullWidth,l=o.fullHeight;r+=o.offsetX*s/c,t-=o.offsetY*n/l,s*=o.width/c,n*=o.height/l}let a=this.filmOffset;a!==0&&(r+=e*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,t,t-n,e,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}},Xs=-90,qs=1,ma=class extends ut{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Mt(Xs,qs,e,t);s.layers=this.layers,this.add(s);let r=new Mt(Xs,qs,e,t);r.layers=this.layers,this.add(r);let o=new Mt(Xs,qs,e,t);o.layers=this.layers,this.add(o);let a=new Mt(Xs,qs,e,t);a.layers=this.layers,this.add(a);let c=new Mt(Xs,qs,e,t);c.layers=this.layers,this.add(c);let l=new Mt(Xs,qs,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){let e=this.coordinateSystem,t=this.children.concat(),[n,s,r,o,a,c]=t;for(let l of t)this.remove(l);if(e===kn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===zr)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(let l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,c,l,h]=this.children,u=e.getRenderTarget(),d=e.getActiveCubeFace(),f=e.getActiveMipmapLevel(),m=e.xr.enabled;e.xr.enabled=!1;let g=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,e.setRenderTarget(n,0,s),e.render(t,r),e.setRenderTarget(n,1,s),e.render(t,o),e.setRenderTarget(n,2,s),e.render(t,a),e.setRenderTarget(n,3,s),e.render(t,c),e.setRenderTarget(n,4,s),e.render(t,l),n.texture.generateMipmaps=g,e.setRenderTarget(n,5,s),e.render(t,h),e.setRenderTarget(u,d,f),e.xr.enabled=m,n.texture.needsPMREMUpdate=!0}},Zr=class extends St{constructor(e,t,n,s,r,o,a,c,l,h){e=e!==void 0?e:[],t=t!==void 0?t:Ui,super(e,t,n,s,r,o,a,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}},ga=class extends Hn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;let n={width:e,height:e,depth:1},s=[n,n,n,n,n,n];this.texture=new Zr(s,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:It}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new Bi(5,5,5),r=new Nn({name:"CubemapFromEquirect",uniforms:xs(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Ut,blending:fi});r.uniforms.tEquirect.value=t;let o=new Xe(s,r),a=t.minFilter;return t.minFilter===an&&(t.minFilter=It),new ma(1,10,this).update(e,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(e,t,n,s){let r=e.getRenderTarget();for(let o=0;o<6;o++)e.setRenderTarget(this,o),e.clear(t,n,s);e.setRenderTarget(r)}};var ss=class extends ut{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new Un,this.environmentIntensity=1,this.environmentRotation=new Un,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),e.background!==null&&(this.background=e.background.clone()),e.environment!==null&&(this.environment=e.environment.clone()),e.fog!==null&&(this.fog=e.fog.clone()),this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),e.overrideMaterial!==null&&(this.overrideMaterial=e.overrideMaterial.clone()),this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){let t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t.object.backgroundRotation=this.backgroundRotation.toArray(),this.environmentIntensity!==1&&(t.object.environmentIntensity=this.environmentIntensity),t.object.environmentRotation=this.environmentRotation.toArray(),t}},tr=class{constructor(e,t){this.isInterleavedBuffer=!0,this.array=e,this.stride=t,this.count=e!==void 0?e.length/t:0,this.usage=fa,this.updateRanges=[],this.version=0,this.uuid=Pn()}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.array=new e.array.constructor(e.array),this.count=e.count,this.stride=e.stride,this.usage=e.usage,this}copyAt(e,t,n){e*=this.stride,n*=t.stride;for(let s=0,r=this.stride;s<r;s++)this.array[e+s]=t.array[n+s];return this}set(e,t=0){return this.array.set(e,t),this}clone(e){e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Pn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);let t=new this.array.constructor(e.arrayBuffers[this.array.buffer._uuid]),n=new this.constructor(t,this.stride);return n.setUsage(this.usage),n}onUpload(e){return this.onUploadCallback=e,this}toJSON(e){return e.arrayBuffers===void 0&&(e.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Pn()),e.arrayBuffers[this.array.buffer._uuid]===void 0&&(e.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}},Zt=new b,nr=class i{constructor(e,t,n,s=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=e,this.itemSize=t,this.offset=n,this.normalized=s}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(e){this.data.needsUpdate=e}applyMatrix4(e){for(let t=0,n=this.data.count;t<n;t++)Zt.fromBufferAttribute(this,t),Zt.applyMatrix4(e),this.setXYZ(t,Zt.x,Zt.y,Zt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)Zt.fromBufferAttribute(this,t),Zt.applyNormalMatrix(e),this.setXYZ(t,Zt.x,Zt.y,Zt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)Zt.fromBufferAttribute(this,t),Zt.transformDirection(e),this.setXYZ(t,Zt.x,Zt.y,Zt.z);return this}getComponent(e,t){let n=this.array[e*this.data.stride+this.offset+t];return this.normalized&&(n=Dn(n,this.array)),n}setComponent(e,t,n){return this.normalized&&(n=rt(n,this.array)),this.data.array[e*this.data.stride+this.offset+t]=n,this}setX(e,t){return this.normalized&&(t=rt(t,this.array)),this.data.array[e*this.data.stride+this.offset]=t,this}setY(e,t){return this.normalized&&(t=rt(t,this.array)),this.data.array[e*this.data.stride+this.offset+1]=t,this}setZ(e,t){return this.normalized&&(t=rt(t,this.array)),this.data.array[e*this.data.stride+this.offset+2]=t,this}setW(e,t){return this.normalized&&(t=rt(t,this.array)),this.data.array[e*this.data.stride+this.offset+3]=t,this}getX(e){let t=this.data.array[e*this.data.stride+this.offset];return this.normalized&&(t=Dn(t,this.array)),t}getY(e){let t=this.data.array[e*this.data.stride+this.offset+1];return this.normalized&&(t=Dn(t,this.array)),t}getZ(e){let t=this.data.array[e*this.data.stride+this.offset+2];return this.normalized&&(t=Dn(t,this.array)),t}getW(e){let t=this.data.array[e*this.data.stride+this.offset+3];return this.normalized&&(t=Dn(t,this.array)),t}setXY(e,t,n){return e=e*this.data.stride+this.offset,this.normalized&&(t=rt(t,this.array),n=rt(n,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this}setXYZ(e,t,n,s){return e=e*this.data.stride+this.offset,this.normalized&&(t=rt(t,this.array),n=rt(n,this.array),s=rt(s,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=s,this}setXYZW(e,t,n,s,r){return e=e*this.data.stride+this.offset,this.normalized&&(t=rt(t,this.array),n=rt(n,this.array),s=rt(s,this.array),r=rt(r,this.array)),this.data.array[e+0]=t,this.data.array[e+1]=n,this.data.array[e+2]=s,this.data.array[e+3]=r,this}clone(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[s+r])}return new pt(new this.array.constructor(t),this.itemSize,this.normalized)}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.clone(e)),new i(e.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(e){if(e===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");let t=[];for(let n=0;n<this.count;n++){let s=n*this.data.stride+this.offset;for(let r=0;r<this.itemSize;r++)t.push(this.data.array[s+r])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return e.interleavedBuffers===void 0&&(e.interleavedBuffers={}),e.interleavedBuffers[this.data.uuid]===void 0&&(e.interleavedBuffers[this.data.uuid]=this.data.toJSON(e)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}};var dd=new b,fd=new je,Ad=new je,ym=new b,pd=new Pe,na=new b,fl=new sn,md=new Pe,Al=new ci,jr=class extends Xe{constructor(e,t){super(e,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode=El,this.bindMatrix=new Pe,this.bindMatrixInverse=new Pe,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){let e=this.geometry;this.boundingBox===null&&(this.boundingBox=new Ft),this.boundingBox.makeEmpty();let t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,na),this.boundingBox.expandByPoint(na)}computeBoundingSphere(){let e=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new sn),this.boundingSphere.makeEmpty();let t=e.getAttribute("position");for(let n=0;n<t.count;n++)this.getVertexPosition(n,na),this.boundingSphere.expandByPoint(na)}copy(e,t){return super.copy(e,t),this.bindMode=e.bindMode,this.bindMatrix.copy(e.bindMatrix),this.bindMatrixInverse.copy(e.bindMatrixInverse),this.skeleton=e.skeleton,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}raycast(e,t){let n=this.material,s=this.matrixWorld;n!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),fl.copy(this.boundingSphere),fl.applyMatrix4(s),e.ray.intersectsSphere(fl)!==!1&&(md.copy(s).invert(),Al.copy(e.ray).applyMatrix4(md),!(this.boundingBox!==null&&Al.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(e,t,Al)))}getVertexPosition(e,t){return super.getVertexPosition(e,t),this.applyBoneTransform(e,t),t}bind(e,t){this.skeleton=e,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){let e=new je,t=this.geometry.attributes.skinWeight;for(let n=0,s=t.count;n<s;n++){e.fromBufferAttribute(t,n);let r=1/e.manhattanLength();r!==1/0?e.multiplyScalar(r):e.set(1,0,0,0),t.setXYZW(n,e.x,e.y,e.z,e.w)}}updateMatrixWorld(e){super.updateMatrixWorld(e),this.bindMode===El?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode===rf?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(e,t){let n=this.skeleton,s=this.geometry;fd.fromBufferAttribute(s.attributes.skinIndex,e),Ad.fromBufferAttribute(s.attributes.skinWeight,e),dd.copy(t).applyMatrix4(this.bindMatrix),t.set(0,0,0);for(let r=0;r<4;r++){let o=Ad.getComponent(r);if(o!==0){let a=fd.getComponent(r);pd.multiplyMatrices(n.bones[a].matrixWorld,n.boneInverses[a]),t.addScaledVector(ym.copy(dd).applyMatrix4(pd),o)}}return t.applyMatrix4(this.bindMatrixInverse)}},ir=class extends ut{constructor(){super(),this.isBone=!0,this.type="Bone"}},rs=class extends St{constructor(e=null,t=1,n=1,s,r,o,a,c,l=Pt,h=Pt,u,d){super(null,o,a,c,l,h,s,r,u,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}},gd=new Pe,xm=new Pe,$r=class i{constructor(e=[],t=[]){this.uuid=Pn(),this.bones=e.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.init()}init(){let e=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(e.length*16),t.length===0)this.calculateInverses();else if(e.length!==t.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let n=0,s=this.bones.length;n<s;n++)this.boneInverses.push(new Pe)}}calculateInverses(){this.boneInverses.length=0;for(let e=0,t=this.bones.length;e<t;e++){let n=new Pe;this.bones[e]&&n.copy(this.bones[e].matrixWorld).invert(),this.boneInverses.push(n)}}pose(){for(let e=0,t=this.bones.length;e<t;e++){let n=this.bones[e];n&&n.matrixWorld.copy(this.boneInverses[e]).invert()}for(let e=0,t=this.bones.length;e<t;e++){let n=this.bones[e];n&&(n.parent&&n.parent.isBone?(n.matrix.copy(n.parent.matrixWorld).invert(),n.matrix.multiply(n.matrixWorld)):n.matrix.copy(n.matrixWorld),n.matrix.decompose(n.position,n.quaternion,n.scale))}}update(){let e=this.bones,t=this.boneInverses,n=this.boneMatrices,s=this.boneTexture;for(let r=0,o=e.length;r<o;r++){let a=e[r]?e[r].matrixWorld:xm;gd.multiplyMatrices(a,t[r]),gd.toArray(n,r*16)}s!==null&&(s.needsUpdate=!0)}clone(){return new i(this.bones,this.boneInverses)}computeBoneTexture(){let e=Math.sqrt(this.bones.length*4);e=Math.ceil(e/4)*4,e=Math.max(e,4);let t=new Float32Array(e*e*4);t.set(this.boneMatrices);let n=new rs(t,e,e,Tt,Dt);return n.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=n,this}getBoneByName(e){for(let t=0,n=this.bones.length;t<n;t++){let s=this.bones[t];if(s.name===e)return s}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(e,t){this.uuid=e.uuid;for(let n=0,s=e.bones.length;n<s;n++){let r=e.bones[n],o=t[r];o===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",r),o=new ir),this.bones.push(o),this.boneInverses.push(new Pe().fromArray(e.boneInverses[n]))}return this.init(),this}toJSON(){let e={metadata:{version:4.6,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};e.uuid=this.uuid;let t=this.bones,n=this.boneInverses;for(let s=0,r=t.length;s<r;s++){let o=t[s];e.bones.push(o.uuid);let a=n[s];e.boneInverses.push(a.toArray())}return e}},Ri=class extends pt{constructor(e,t,n,s=1){super(e,t,n),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=s}copy(e){return super.copy(e),this.meshPerAttribute=e.meshPerAttribute,this}toJSON(){let e=super.toJSON();return e.meshPerAttribute=this.meshPerAttribute,e.isInstancedBufferAttribute=!0,e}},Ys=new Pe,_d=new Pe,ia=[],Ed=new Ft,Cm=new Pe,Or=new Xe,Qr=new sn,eo=class extends Xe{constructor(e,t,n){super(e,t),this.isInstancedMesh=!0,this.instanceMatrix=new Ri(new Float32Array(n*16),16),this.instanceColor=null,this.morphTexture=null,this.count=n,this.boundingBox=null,this.boundingSphere=null;for(let s=0;s<n;s++)this.setMatrixAt(s,Cm)}computeBoundingBox(){let e=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Ft),e.boundingBox===null&&e.computeBoundingBox(),this.boundingBox.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Ys),Ed.copy(e.boundingBox).applyMatrix4(Ys),this.boundingBox.union(Ed)}computeBoundingSphere(){let e=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new sn),e.boundingSphere===null&&e.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let n=0;n<t;n++)this.getMatrixAt(n,Ys),Qr.copy(e.boundingSphere).applyMatrix4(Ys),this.boundingSphere.union(Qr)}copy(e,t){return super.copy(e,t),this.instanceMatrix.copy(e.instanceMatrix),e.morphTexture!==null&&(this.morphTexture=e.morphTexture.clone()),e.instanceColor!==null&&(this.instanceColor=e.instanceColor.clone()),this.count=e.count,e.boundingBox!==null&&(this.boundingBox=e.boundingBox.clone()),e.boundingSphere!==null&&(this.boundingSphere=e.boundingSphere.clone()),this}getColorAt(e,t){t.fromArray(this.instanceColor.array,e*3)}getMatrixAt(e,t){t.fromArray(this.instanceMatrix.array,e*16)}getMorphAt(e,t){let n=t.morphTargetInfluences,s=this.morphTexture.source.data.data,r=n.length+1,o=e*r+1;for(let a=0;a<n.length;a++)n[a]=s[o+a]}raycast(e,t){let n=this.matrixWorld,s=this.count;if(Or.geometry=this.geometry,Or.material=this.material,Or.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Qr.copy(this.boundingSphere),Qr.applyMatrix4(n),e.ray.intersectsSphere(Qr)!==!1))for(let r=0;r<s;r++){this.getMatrixAt(r,Ys),_d.multiplyMatrices(n,Ys),Or.matrixWorld=_d,Or.raycast(e,ia);for(let o=0,a=ia.length;o<a;o++){let c=ia[o];c.instanceId=r,c.object=this,t.push(c)}ia.length=0}}setColorAt(e,t){this.instanceColor===null&&(this.instanceColor=new Ri(new Float32Array(this.instanceMatrix.count*3).fill(1),3)),t.toArray(this.instanceColor.array,e*3)}setMatrixAt(e,t){t.toArray(this.instanceMatrix.array,e*16)}setMorphAt(e,t){let n=t.morphTargetInfluences,s=n.length+1;this.morphTexture===null&&(this.morphTexture=new rs(new Float32Array(s*this.count),s,this.count,qn,Dt));let r=this.morphTexture.source.data.data,o=0;for(let l=0;l<n.length;l++)o+=n[l];let a=this.geometry.morphTargetsRelative?1:1-o,c=s*e;r[c]=a,r.set(n,c+1)}updateMorphTargets(){}dispose(){return this.dispatchEvent({type:"dispose"}),this.morphTexture!==null&&(this.morphTexture.dispose(),this.morphTexture=null),this}},pl=new b,Mm=new b,Im=new Le,xn=class{constructor(e=new b(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,s){return this.normal.set(e,t,n),this.constant=s,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){let s=pl.subVectors(n,t).cross(Mm.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(s,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){let e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t){let n=e.delta(pl),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;let r=-(e.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:t.copy(e.start).addScaledVector(n,r)}intersectsLine(e){let t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){let n=t||Im.getNormalMatrix(e),s=this.coplanarPoint(pl).applyMatrix4(e),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}},Yi=new sn,sa=new b,sr=class{constructor(e=new xn,t=new xn,n=new xn,s=new xn,r=new xn,o=new xn){this.planes=[e,t,n,s,r,o]}set(e,t,n,s,r,o){let a=this.planes;return a[0].copy(e),a[1].copy(t),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(e){let t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=kn){let n=this.planes,s=e.elements,r=s[0],o=s[1],a=s[2],c=s[3],l=s[4],h=s[5],u=s[6],d=s[7],f=s[8],m=s[9],g=s[10],p=s[11],A=s[12],I=s[13],C=s[14],E=s[15];if(n[0].setComponents(c-r,d-l,p-f,E-A).normalize(),n[1].setComponents(c+r,d+l,p+f,E+A).normalize(),n[2].setComponents(c+o,d+h,p+m,E+I).normalize(),n[3].setComponents(c-o,d-h,p-m,E-I).normalize(),n[4].setComponents(c-a,d-u,p-g,E-C).normalize(),t===kn)n[5].setComponents(c+a,d+u,p+g,E+C).normalize();else if(t===zr)n[5].setComponents(a,u,g,C).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),Yi.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{let t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),Yi.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(Yi)}intersectsSprite(e){return Yi.center.set(0,0,0),Yi.radius=.7071067811865476,Yi.applyMatrix4(e.matrixWorld),this.intersectsSphere(Yi)}intersectsSphere(e){let t=this.planes,n=e.center,s=-e.radius;for(let r=0;r<6;r++)if(t[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(e){let t=this.planes;for(let n=0;n<6;n++){let s=t[n];if(sa.x=s.normal.x>0?e.max.x:e.min.x,sa.y=s.normal.y>0?e.max.y:e.min.y,sa.z=s.normal.z>0?e.max.z:e.min.z,s.distanceToPoint(sa)<0)return!1}return!0}containsPoint(e){let t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var rr=class extends $t{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new Ee(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}},_a=new b,Ea=new b,yd=new Pe,kr=new ci,ra=new sn,ml=new b,xd=new b,os=class extends ut{constructor(e=new Ht,t=new rr){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[0];for(let s=1,r=t.count;s<r;s++)_a.fromBufferAttribute(t,s-1),Ea.fromBufferAttribute(t,s),n[s]=n[s-1],n[s]+=_a.distanceTo(Ea);e.setAttribute("lineDistance",new Gt(n,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(e,t){let n=this.geometry,s=this.matrixWorld,r=e.params.Line.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),ra.copy(n.boundingSphere),ra.applyMatrix4(s),ra.radius+=r,e.ray.intersectsSphere(ra)===!1)return;yd.copy(s).invert(),kr.copy(e.ray).applyMatrix4(yd);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=this.isLineSegments?2:1,h=n.index,d=n.attributes.position;if(h!==null){let f=Math.max(0,o.start),m=Math.min(h.count,o.start+o.count);for(let g=f,p=m-1;g<p;g+=l){let A=h.getX(g),I=h.getX(g+1),C=oa(this,e,kr,c,A,I);C&&t.push(C)}if(this.isLineLoop){let g=h.getX(m-1),p=h.getX(f),A=oa(this,e,kr,c,g,p);A&&t.push(A)}}else{let f=Math.max(0,o.start),m=Math.min(d.count,o.start+o.count);for(let g=f,p=m-1;g<p;g+=l){let A=oa(this,e,kr,c,g,g+1);A&&t.push(A)}if(this.isLineLoop){let g=oa(this,e,kr,c,m-1,f);g&&t.push(g)}}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function oa(i,e,t,n,s,r){let o=i.geometry.attributes.position;if(_a.fromBufferAttribute(o,s),Ea.fromBufferAttribute(o,r),t.distanceSqToSegment(_a,Ea,ml,xd)>n)return;ml.applyMatrix4(i.matrixWorld);let c=e.ray.origin.distanceTo(ml);if(!(c<e.near||c>e.far))return{distance:c,point:xd.clone().applyMatrix4(i.matrixWorld),index:s,face:null,faceIndex:null,barycoord:null,object:i}}var Cd=new b,Md=new b,to=class extends os{constructor(e,t){super(e,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){let e=this.geometry;if(e.index===null){let t=e.attributes.position,n=[];for(let s=0,r=t.count;s<r;s+=2)Cd.fromBufferAttribute(t,s),Md.fromBufferAttribute(t,s+1),n[s]=s===0?0:n[s-1],n[s+1]=n[s]+Cd.distanceTo(Md);e.setAttribute("lineDistance",new Gt(n,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}},no=class extends os{constructor(e,t){super(e,t),this.isLineLoop=!0,this.type="LineLoop"}},or=class extends $t{constructor(e){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Ee(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.alphaMap=e.alphaMap,this.size=e.size,this.sizeAttenuation=e.sizeAttenuation,this.fog=e.fog,this}},Id=new Pe,Il=new ci,aa=new sn,ca=new b,io=class extends ut{constructor(e=new Ht,t=new or){super(),this.isPoints=!0,this.type="Points",this.geometry=e,this.material=t,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}raycast(e,t){let n=this.geometry,s=this.matrixWorld,r=e.params.Points.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),aa.copy(n.boundingSphere),aa.applyMatrix4(s),aa.radius+=r,e.ray.intersectsSphere(aa)===!1)return;Id.copy(s).invert(),Il.copy(e.ray).applyMatrix4(Id);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=n.index,u=n.attributes.position;if(l!==null){let d=Math.max(0,o.start),f=Math.min(l.count,o.start+o.count);for(let m=d,g=f;m<g;m++){let p=l.getX(m);ca.fromBufferAttribute(u,p),Sd(ca,p,c,s,e,t,this)}}else{let d=Math.max(0,o.start),f=Math.min(u.count,o.start+o.count);for(let m=d,g=f;m<g;m++)ca.fromBufferAttribute(u,m),Sd(ca,m,c,s,e,t,this)}}updateMorphTargets(){let t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){let s=t[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function Sd(i,e,t,n,s,r,o){let a=Il.distanceSqToPoint(i);if(a<t){let c=new b;Il.closestPointToPoint(i,c),c.applyMatrix4(n);let l=s.ray.origin.distanceTo(c);if(l<s.near||l>s.far)return;r.push({distance:l,distanceToRay:Math.sqrt(a),point:c,index:e,face:null,faceIndex:null,barycoord:null,object:o})}}var fn=class extends ut{constructor(){super(),this.isGroup=!0,this.type="Group"}};var Di=class extends St{constructor(e,t,n,s,r,o,a,c,l,h,u,d){super(null,o,a,c,l,h,s,r,u,d),this.isCompressedTexture=!0,this.image={width:t,height:n},this.mipmaps=e,this.flipY=!1,this.generateMipmaps=!1}},so=class extends Di{constructor(e,t,n,s,r,o){super(e,t,n,r,o),this.isCompressedArrayTexture=!0,this.image.depth=s,this.wrapR=Ln,this.layerUpdates=new Set}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}},ro=class extends Di{constructor(e,t,n){super(void 0,e[0].width,e[0].height,t,n,Ui),this.isCompressedCubeTexture=!0,this.isCubeTexture=!0,this.image=e}},Li=class extends St{constructor(e,t,n,s,r,o,a,c,l){super(e,t,n,s,r,o,a,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}},oo=class extends St{constructor(e,t,n,s,r,o,a,c,l,h=Zi){if(h!==Zi&&h!==es)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===Zi&&(n=Oi),n===void 0&&h===es&&(n=As),super(null,s,r,o,a,c,h,n,l),this.isDepthTexture=!0,this.image={width:e,height:t},this.magFilter=a!==void 0?a:Pt,this.minFilter=c!==void 0?c:Pt,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.compareFunction=e.compareFunction,this}toJSON(e){let t=super.toJSON(e);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}};var ar=class i extends Ht{constructor(e=1,t=32,n=0,s=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:s},t=Math.max(3,t);let r=[],o=[],a=[],c=[],l=new b,h=new ve;o.push(0,0,0),a.push(0,0,1),c.push(.5,.5);for(let u=0,d=3;u<=t;u++,d+=3){let f=n+u/t*s;l.x=e*Math.cos(f),l.y=e*Math.sin(f),o.push(l.x,l.y,l.z),a.push(0,0,1),h.x=(o[d]/e+1)/2,h.y=(o[d+1]/e+1)/2,c.push(h.x,h.y)}for(let u=1;u<=t;u++)r.push(u,u+1,0);this.setIndex(r),this.setAttribute("position",new Gt(o,3)),this.setAttribute("normal",new Gt(a,3)),this.setAttribute("uv",new Gt(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.radius,e.segments,e.thetaStart,e.thetaLength)}};var ao=class i extends Ht{constructor(e=1,t=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:s};let r=e/2,o=t/2,a=Math.floor(n),c=Math.floor(s),l=a+1,h=c+1,u=e/a,d=t/c,f=[],m=[],g=[],p=[];for(let A=0;A<h;A++){let I=A*d-o;for(let C=0;C<l;C++){let E=C*u-r;m.push(E,-I,0),g.push(0,0,1),p.push(C/a),p.push(1-A/c)}}for(let A=0;A<c;A++)for(let I=0;I<a;I++){let C=I+l*A,E=I+l*(A+1),w=I+1+l*(A+1),v=I+1+l*A;f.push(C,E,v),f.push(E,w,v)}this.setIndex(f),this.setAttribute("position",new Gt(m,3)),this.setAttribute("normal",new Gt(g,3)),this.setAttribute("uv",new Gt(p,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new i(e.width,e.height,e.widthSegments,e.heightSegments)}};var co=class extends $t{constructor(e){super(),this.isShadowMaterial=!0,this.type="ShadowMaterial",this.color=new Ee(0),this.transparent=!0,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.fog=e.fog,this}};var Cn=class extends $t{constructor(e){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new Ee(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new Ee(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Kl,this.normalScale=new ve(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new Un,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.defines={STANDARD:""},this.color.copy(e.color),this.roughness=e.roughness,this.metalness=e.metalness,this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.emissive.copy(e.emissive),this.emissiveMap=e.emissiveMap,this.emissiveIntensity=e.emissiveIntensity,this.bumpMap=e.bumpMap,this.bumpScale=e.bumpScale,this.normalMap=e.normalMap,this.normalMapType=e.normalMapType,this.normalScale.copy(e.normalScale),this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.roughnessMap=e.roughnessMap,this.metalnessMap=e.metalnessMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.envMapIntensity=e.envMapIntensity,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.flatShading=e.flatShading,this.fog=e.fog,this}},rn=class extends Cn{constructor(e){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new ve(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return Oe(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new Ee(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new Ee(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new Ee(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(e)}get anisotropy(){return this._anisotropy}set anisotropy(e){this._anisotropy>0!=e>0&&this.version++,this._anisotropy=e}get clearcoat(){return this._clearcoat}set clearcoat(e){this._clearcoat>0!=e>0&&this.version++,this._clearcoat=e}get iridescence(){return this._iridescence}set iridescence(e){this._iridescence>0!=e>0&&this.version++,this._iridescence=e}get dispersion(){return this._dispersion}set dispersion(e){this._dispersion>0!=e>0&&this.version++,this._dispersion=e}get sheen(){return this._sheen}set sheen(e){this._sheen>0!=e>0&&this.version++,this._sheen=e}get transmission(){return this._transmission}set transmission(e){this._transmission>0!=e>0&&this.version++,this._transmission=e}copy(e){return super.copy(e),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=e.anisotropy,this.anisotropyRotation=e.anisotropyRotation,this.anisotropyMap=e.anisotropyMap,this.clearcoat=e.clearcoat,this.clearcoatMap=e.clearcoatMap,this.clearcoatRoughness=e.clearcoatRoughness,this.clearcoatRoughnessMap=e.clearcoatRoughnessMap,this.clearcoatNormalMap=e.clearcoatNormalMap,this.clearcoatNormalScale.copy(e.clearcoatNormalScale),this.dispersion=e.dispersion,this.ior=e.ior,this.iridescence=e.iridescence,this.iridescenceMap=e.iridescenceMap,this.iridescenceIOR=e.iridescenceIOR,this.iridescenceThicknessRange=[...e.iridescenceThicknessRange],this.iridescenceThicknessMap=e.iridescenceThicknessMap,this.sheen=e.sheen,this.sheenColor.copy(e.sheenColor),this.sheenColorMap=e.sheenColorMap,this.sheenRoughness=e.sheenRoughness,this.sheenRoughnessMap=e.sheenRoughnessMap,this.transmission=e.transmission,this.transmissionMap=e.transmissionMap,this.thickness=e.thickness,this.thicknessMap=e.thicknessMap,this.attenuationDistance=e.attenuationDistance,this.attenuationColor.copy(e.attenuationColor),this.specularIntensity=e.specularIntensity,this.specularIntensityMap=e.specularIntensityMap,this.specularColor.copy(e.specularColor),this.specularColorMap=e.specularColorMap,this}};var ya=class extends $t{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=af,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}},xa=class extends $t{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}};function la(i,e,t){return!i||!t&&i.constructor===e?i:typeof e.BYTES_PER_ELEMENT=="number"?new e(i):Array.prototype.slice.call(i)}function Sm(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function vm(i){function e(s,r){return i[s]-i[r]}let t=i.length,n=new Array(t);for(let s=0;s!==t;++s)n[s]=s;return n.sort(e),n}function vd(i,e,t){let n=i.length,s=new i.constructor(n);for(let r=0,o=0;o!==n;++r){let a=t[r]*e;for(let c=0;c!==e;++c)s[o++]=i[a+c]}return s}function Mf(i,e,t,n){let s=1,r=i[0];for(;r!==void 0&&r[n]===void 0;)r=i[s++];if(r===void 0)return;let o=r[n];if(o!==void 0)if(Array.isArray(o))do o=r[n],o!==void 0&&(e.push(r.time),t.push.apply(t,o)),r=i[s++];while(r!==void 0);else if(o.toArray!==void 0)do o=r[n],o!==void 0&&(e.push(r.time),o.toArray(t,t.length)),r=i[s++];while(r!==void 0);else do o=r[n],o!==void 0&&(e.push(r.time),t.push(o)),r=i[s++];while(r!==void 0)}var li=class{constructor(e,t,n,s){this.parameterPositions=e,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new t.constructor(n),this.sampleValues=t,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(e){let t=this.parameterPositions,n=this._cachedIndex,s=t[n],r=t[n-1];n:{e:{let o;t:{i:if(!(e<s)){for(let a=n+2;;){if(s===void 0){if(e<r)break i;return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(r=s,s=t[++n],e<s)break e}o=t.length;break t}if(!(e>=r)){let a=t[1];e<a&&(n=2,r=a);for(let c=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===c)break;if(s=r,r=t[--n-1],e>=r)break e}o=n,n=0;break t}break n}for(;n<o;){let a=n+o>>>1;e<t[a]?o=a:n=a+1}if(s=t[n],r=t[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=t.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,e,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s;for(let o=0;o!==s;++o)t[o]=n[r+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},Ca=class extends li{constructor(e,t,n,s){super(e,t,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:yl,endingEnd:yl}}intervalChanged_(e,t,n){let s=this.parameterPositions,r=e-2,o=e+1,a=s[r],c=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case xl:r=e,a=2*t-n;break;case Cl:r=s.length-2,a=t+s[r]-s[r+1];break;default:r=e,a=n}if(c===void 0)switch(this.getSettings_().endingEnd){case xl:o=e,c=2*n-t;break;case Cl:o=1,c=n+s[1]-s[0];break;default:o=e-1,c=t}let l=(n-t)*.5,h=this.valueSize;this._weightPrev=l/(t-a),this._weightNext=l/(c-n),this._offsetPrev=r*h,this._offsetNext=o*h}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,h=this._offsetPrev,u=this._offsetNext,d=this._weightPrev,f=this._weightNext,m=(n-t)/(s-t),g=m*m,p=g*m,A=-d*p+2*d*g-d*m,I=(1+d)*p+(-1.5-2*d)*g+(-.5+d)*m+1,C=(-1-f)*p+(1.5+f)*g+.5*m,E=f*p-f*g;for(let w=0;w!==a;++w)r[w]=A*o[h+w]+I*o[l+w]+C*o[c+w]+E*o[u+w];return r}},Ma=class extends li{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=e*a,l=c-a,h=(n-t)/(s-t),u=1-h;for(let d=0;d!==a;++d)r[d]=o[l+d]*u+o[c+d]*h;return r}},Ia=class extends li{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e){return this.copySampleValue_(e-1)}},An=class{constructor(e,t,n,s){if(e===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+e);this.name=e,this.times=la(t,this.TimeBufferType),this.values=la(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(e){let t=e.constructor,n;if(t.toJSON!==this.toJSON)n=t.toJSON(e);else{n={name:e.name,times:la(e.times,Array),values:la(e.values,Array)};let s=e.getInterpolation();s!==e.DefaultInterpolation&&(n.interpolation=s)}return n.type=e.ValueTypeName,n}InterpolantFactoryMethodDiscrete(e){return new Ia(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodLinear(e){return new Ma(this.times,this.values,this.getValueSize(),e)}InterpolantFactoryMethodSmooth(e){return new Ca(this.times,this.values,this.getValueSize(),e)}setInterpolation(e){let t;switch(e){case ts:t=this.InterpolantFactoryMethodDiscrete;break;case ns:t=this.InterpolantFactoryMethodLinear;break;case ha:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(e!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return ts;case this.InterpolantFactoryMethodLinear:return ns;case this.InterpolantFactoryMethodSmooth:return ha}}getValueSize(){return this.values.length/this.times.length}shift(e){if(e!==0){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]+=e}return this}scale(e){if(e!==1){let t=this.times;for(let n=0,s=t.length;n!==s;++n)t[n]*=e}return this}trim(e,t){let n=this.times,s=n.length,r=0,o=s-1;for(;r!==s&&n[r]<e;)++r;for(;o!==-1&&n[o]>t;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=n.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let e=!0,t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),e=!1);let n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),e=!1);let o=null;for(let a=0;a!==r;a++){let c=n[a];if(typeof c=="number"&&isNaN(c)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,c),e=!1;break}if(o!==null&&o>c){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,c,o),e=!1;break}o=c}if(s!==void 0&&Sm(s))for(let a=0,c=s.length;a!==c;++a){let l=s[a];if(isNaN(l)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,l),e=!1;break}}return e}optimize(){let e=this.times.slice(),t=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===ha,r=e.length-1,o=1;for(let a=1;a<r;++a){let c=!1,l=e[a],h=e[a+1];if(l!==h&&(a!==1||l!==e[0]))if(s)c=!0;else{let u=a*n,d=u-n,f=u+n;for(let m=0;m!==n;++m){let g=t[u+m];if(g!==t[d+m]||g!==t[f+m]){c=!0;break}}}if(c){if(a!==o){e[o]=e[a];let u=a*n,d=o*n;for(let f=0;f!==n;++f)t[d+f]=t[u+f]}++o}}if(r>0){e[o]=e[r];for(let a=r*n,c=o*n,l=0;l!==n;++l)t[c+l]=t[a+l];++o}return o!==e.length?(this.times=e.slice(0,o),this.values=t.slice(0,o*n)):(this.times=e,this.values=t),this}clone(){let e=this.times.slice(),t=this.values.slice(),n=this.constructor,s=new n(this.name,e,t);return s.createInterpolant=this.createInterpolant,s}};An.prototype.TimeBufferType=Float32Array;An.prototype.ValueBufferType=Float32Array;An.prototype.DefaultInterpolation=ns;var hi=class extends An{constructor(e,t,n){super(e,t,n)}};hi.prototype.ValueTypeName="bool";hi.prototype.ValueBufferType=Array;hi.prototype.DefaultInterpolation=ts;hi.prototype.InterpolantFactoryMethodLinear=void 0;hi.prototype.InterpolantFactoryMethodSmooth=void 0;var lo=class extends An{};lo.prototype.ValueTypeName="color";var Vn=class extends An{};Vn.prototype.ValueTypeName="number";var Sa=class extends li{constructor(e,t,n,s){super(e,t,n,s)}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=(n-t)/(s-t),l=e*a;for(let h=l+a;l!==h;l+=4)jt.slerpFlat(r,0,o,l-a,o,l,c);return r}},zn=class extends An{InterpolantFactoryMethodLinear(e){return new Sa(this.times,this.values,this.getValueSize(),e)}};zn.prototype.ValueTypeName="quaternion";zn.prototype.InterpolantFactoryMethodSmooth=void 0;var ui=class extends An{constructor(e,t,n){super(e,t,n)}};ui.prototype.ValueTypeName="string";ui.prototype.ValueBufferType=Array;ui.prototype.DefaultInterpolation=ts;ui.prototype.InterpolantFactoryMethodLinear=void 0;ui.prototype.InterpolantFactoryMethodSmooth=void 0;var Wn=class extends An{};Wn.prototype.ValueTypeName="vector";var ho=class{constructor(e="",t=-1,n=[],s=of){this.name=e,this.tracks=n,this.duration=t,this.blendMode=s,this.uuid=Pn(),this.duration<0&&this.resetDuration()}static parse(e){let t=[],n=e.tracks,s=1/(e.fps||1);for(let o=0,a=n.length;o!==a;++o)t.push(wm(n[o]).scale(s));let r=new this(e.name,e.duration,t,e.blendMode);return r.uuid=e.uuid,r}static toJSON(e){let t=[],n=e.tracks,s={name:e.name,duration:e.duration,tracks:t,uuid:e.uuid,blendMode:e.blendMode};for(let r=0,o=n.length;r!==o;++r)t.push(An.toJSON(n[r]));return s}static CreateFromMorphTargetSequence(e,t,n,s){let r=t.length,o=[];for(let a=0;a<r;a++){let c=[],l=[];c.push((a+r-1)%r,a,(a+1)%r),l.push(0,1,0);let h=vm(c);c=vd(c,1,h),l=vd(l,1,h),!s&&c[0]===0&&(c.push(r),l.push(l[0])),o.push(new Vn(".morphTargetInfluences["+t[a].name+"]",c,l).scale(1/n))}return new this(e,-1,o)}static findByName(e,t){let n=e;if(!Array.isArray(e)){let s=e;n=s.geometry&&s.geometry.animations||s.animations}for(let s=0;s<n.length;s++)if(n[s].name===t)return n[s];return null}static CreateClipsFromMorphTargetSequences(e,t,n){let s={},r=/^([\w-]*?)([\d]+)$/;for(let a=0,c=e.length;a<c;a++){let l=e[a],h=l.name.match(r);if(h&&h.length>1){let u=h[1],d=s[u];d||(s[u]=d=[]),d.push(l)}}let o=[];for(let a in s)o.push(this.CreateFromMorphTargetSequence(a,s[a],t,n));return o}static parseAnimation(e,t){if(!e)return console.error("THREE.AnimationClip: No animation in JSONLoader data."),null;let n=function(u,d,f,m,g){if(f.length!==0){let p=[],A=[];Mf(f,p,A,m),p.length!==0&&g.push(new u(d,p,A))}},s=[],r=e.name||"default",o=e.fps||30,a=e.blendMode,c=e.length||-1,l=e.hierarchy||[];for(let u=0;u<l.length;u++){let d=l[u].keys;if(!(!d||d.length===0))if(d[0].morphTargets){let f={},m;for(m=0;m<d.length;m++)if(d[m].morphTargets)for(let g=0;g<d[m].morphTargets.length;g++)f[d[m].morphTargets[g]]=-1;for(let g in f){let p=[],A=[];for(let I=0;I!==d[m].morphTargets.length;++I){let C=d[m];p.push(C.time),A.push(C.morphTarget===g?1:0)}s.push(new Vn(".morphTargetInfluence["+g+"]",p,A))}c=f.length*o}else{let f=".bones["+t[u].name+"]";n(Wn,f+".position",d,"pos",s),n(zn,f+".quaternion",d,"rot",s),n(Wn,f+".scale",d,"scl",s)}}return s.length===0?null:new this(r,c,s,a)}resetDuration(){let e=this.tracks,t=0;for(let n=0,s=e.length;n!==s;++n){let r=this.tracks[n];t=Math.max(t,r.times[r.times.length-1])}return this.duration=t,this}trim(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].trim(0,this.duration);return this}validate(){let e=!0;for(let t=0;t<this.tracks.length;t++)e=e&&this.tracks[t].validate();return e}optimize(){for(let e=0;e<this.tracks.length;e++)this.tracks[e].optimize();return this}clone(){let e=[];for(let t=0;t<this.tracks.length;t++)e.push(this.tracks[t].clone());return new this.constructor(this.name,this.duration,e,this.blendMode)}toJSON(){return this.constructor.toJSON(this)}};function Tm(i){switch(i.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return Vn;case"vector":case"vector2":case"vector3":case"vector4":return Wn;case"color":return lo;case"quaternion":return zn;case"bool":case"boolean":return hi;case"string":return ui}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+i)}function wm(i){if(i.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");let e=Tm(i.type);if(i.times===void 0){let t=[],n=[];Mf(i.keys,t,n,"value"),i.times=t,i.values=n}return e.parse!==void 0?e.parse(i):new e(i.name,i.times,i.values,i.interpolation)}var oi={enabled:!1,files:{},add:function(i,e){this.enabled!==!1&&(this.files[i]=e)},get:function(i){if(this.enabled!==!1)return this.files[i]},remove:function(i){delete this.files[i]},clear:function(){this.files={}}},va=class{constructor(e,t,n){let s=this,r=!1,o=0,a=0,c,l=[];this.onStart=void 0,this.onLoad=e,this.onProgress=t,this.onError=n,this.itemStart=function(h){a++,r===!1&&s.onStart!==void 0&&s.onStart(h,o,a),r=!0},this.itemEnd=function(h){o++,s.onProgress!==void 0&&s.onProgress(h,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return c?c(h):h},this.setURLModifier=function(h){return c=h,this},this.addHandler=function(h,u){return l.push(h,u),this},this.removeHandler=function(h){let u=l.indexOf(h);return u!==-1&&l.splice(u,2),this},this.getHandler=function(h){for(let u=0,d=l.length;u<d;u+=2){let f=l[u],m=l[u+1];if(f.global&&(f.lastIndex=0),f.test(h))return m}return null}}},If=new va,on=class{constructor(e){this.manager=e!==void 0?e:If,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(e,t){let n=this;return new Promise(function(s,r){n.load(e,s,t,r)})}parse(){}setCrossOrigin(e){return this.crossOrigin=e,this}setWithCredentials(e){return this.withCredentials=e,this}setPath(e){return this.path=e,this}setResourcePath(e){return this.resourcePath=e,this}setRequestHeader(e){return this.requestHeader=e,this}};on.DEFAULT_MATERIAL_NAME="__DEFAULT";var ri={},Sl=class extends Error{constructor(e,t){super(e),this.response=t}},pn=class extends on{constructor(e){super(e)}load(e,t,n,s){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=oi.get(e);if(r!==void 0)return this.manager.itemStart(e),setTimeout(()=>{t&&t(r),this.manager.itemEnd(e)},0),r;if(ri[e]!==void 0){ri[e].push({onLoad:t,onProgress:n,onError:s});return}ri[e]=[],ri[e].push({onLoad:t,onProgress:n,onError:s});let o=new Request(e,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin"}),a=this.mimeType,c=this.responseType;fetch(o).then(l=>{if(l.status===200||l.status===0){if(l.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||l.body===void 0||l.body.getReader===void 0)return l;let h=ri[e],u=l.body.getReader(),d=l.headers.get("X-File-Size")||l.headers.get("Content-Length"),f=d?parseInt(d):0,m=f!==0,g=0,p=new ReadableStream({start(A){I();function I(){u.read().then(({done:C,value:E})=>{if(C)A.close();else{g+=E.byteLength;let w=new ProgressEvent("progress",{lengthComputable:m,loaded:g,total:f});for(let v=0,T=h.length;v<T;v++){let F=h[v];F.onProgress&&F.onProgress(w)}A.enqueue(E),I()}},C=>{A.error(C)})}}});return new Response(p)}else throw new Sl(`fetch for "${l.url}" responded with ${l.status}: ${l.statusText}`,l)}).then(l=>{switch(c){case"arraybuffer":return l.arrayBuffer();case"blob":return l.blob();case"document":return l.text().then(h=>new DOMParser().parseFromString(h,a));case"json":return l.json();default:if(a===void 0)return l.text();{let u=/charset="?([^;"\s]*)"?/i.exec(a),d=u&&u[1]?u[1].toLowerCase():void 0,f=new TextDecoder(d);return l.arrayBuffer().then(m=>f.decode(m))}}}).then(l=>{oi.add(e,l);let h=ri[e];delete ri[e];for(let u=0,d=h.length;u<d;u++){let f=h[u];f.onLoad&&f.onLoad(l)}}).catch(l=>{let h=ri[e];if(h===void 0)throw this.manager.itemError(e),l;delete ri[e];for(let u=0,d=h.length;u<d;u++){let f=h[u];f.onError&&f.onError(l)}this.manager.itemError(e)}).finally(()=>{this.manager.itemEnd(e)}),this.manager.itemStart(e)}setResponseType(e){return this.responseType=e,this}setMimeType(e){return this.mimeType=e,this}};var Ta=class extends on{constructor(e){super(e)}load(e,t,n,s){this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,o=oi.get(e);if(o!==void 0)return r.manager.itemStart(e),setTimeout(function(){t&&t(o),r.manager.itemEnd(e)},0),o;let a=$s("img");function c(){h(),oi.add(e,this),t&&t(this),r.manager.itemEnd(e)}function l(u){h(),s&&s(u),r.manager.itemError(e),r.manager.itemEnd(e)}function h(){a.removeEventListener("load",c,!1),a.removeEventListener("error",l,!1)}return a.addEventListener("load",c,!1),a.addEventListener("error",l,!1),e.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(a.crossOrigin=this.crossOrigin),r.manager.itemStart(e),a.src=e,a}};var as=class extends on{constructor(e){super(e)}load(e,t,n,s){let r=new St,o=new Ta(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(e,function(a){r.image=a,r.needsUpdate=!0,t!==void 0&&t(r)},n,s),r}},cs=class extends ut{constructor(e,t=1){super(),this.isLight=!0,this.type="Light",this.color=new Ee(e),this.intensity=t}dispose(){}copy(e,t){return super.copy(e,t),this.color.copy(e.color),this.intensity=e.intensity,this}toJSON(e){let t=super.toJSON(e);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),this.target!==void 0&&(t.object.target=this.target.uuid),t}};var gl=new Pe,Td=new b,wd=new b,uo=class{constructor(e){this.camera=e,this.intensity=1,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new ve(512,512),this.map=null,this.mapPass=null,this.matrix=new Pe,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new sr,this._frameExtents=new ve(1,1),this._viewportCount=1,this._viewports=[new je(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(e){let t=this.camera,n=this.matrix;Td.setFromMatrixPosition(e.matrixWorld),t.position.copy(Td),wd.setFromMatrixPosition(e.target.matrixWorld),t.lookAt(wd),t.updateMatrixWorld(),gl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(gl),n.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),n.multiply(gl)}getViewport(e){return this._viewports[e]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(e){return this.camera=e.camera.clone(),this.intensity=e.intensity,this.bias=e.bias,this.radius=e.radius,this.mapSize.copy(e.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){let e={};return this.intensity!==1&&(e.intensity=this.intensity),this.bias!==0&&(e.bias=this.bias),this.normalBias!==0&&(e.normalBias=this.normalBias),this.radius!==1&&(e.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(e.mapSize=this.mapSize.toArray()),e.camera=this.camera.toJSON(!1).object,delete e.camera.matrix,e}},vl=class extends uo{constructor(){super(new Mt(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(e){let t=this.camera,n=is*2*e.angle*this.focus,s=this.mapSize.width/this.mapSize.height,r=e.distance||t.far;(n!==t.fov||s!==t.aspect||r!==t.far)&&(t.fov=n,t.aspect=s,t.far=r,t.updateProjectionMatrix()),super.updateMatrices(e)}copy(e){return super.copy(e),this.focus=e.focus,this}},fo=class extends cs{constructor(e,t,n=0,s=Math.PI/3,r=0,o=2){super(e,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(ut.DEFAULT_UP),this.updateMatrix(),this.target=new ut,this.distance=n,this.angle=s,this.penumbra=r,this.decay=o,this.map=null,this.shadow=new vl}get power(){return this.intensity*Math.PI}set power(e){this.intensity=e/Math.PI}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.angle=e.angle,this.penumbra=e.penumbra,this.decay=e.decay,this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},bd=new Pe,Gr=new b,_l=new b,Tl=class extends uo{constructor(){super(new Mt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new ve(4,2),this._viewportCount=6,this._viewports=[new je(2,1,1,1),new je(0,1,1,1),new je(3,1,1,1),new je(1,1,1,1),new je(3,0,1,1),new je(1,0,1,1)],this._cubeDirections=[new b(1,0,0),new b(-1,0,0),new b(0,0,1),new b(0,0,-1),new b(0,1,0),new b(0,-1,0)],this._cubeUps=[new b(0,1,0),new b(0,1,0),new b(0,1,0),new b(0,1,0),new b(0,0,1),new b(0,0,-1)]}updateMatrices(e,t=0){let n=this.camera,s=this.matrix,r=e.distance||n.far;r!==n.far&&(n.far=r,n.updateProjectionMatrix()),Gr.setFromMatrixPosition(e.matrixWorld),n.position.copy(Gr),_l.copy(n.position),_l.add(this._cubeDirections[t]),n.up.copy(this._cubeUps[t]),n.lookAt(_l),n.updateMatrixWorld(),s.makeTranslation(-Gr.x,-Gr.y,-Gr.z),bd.multiplyMatrices(n.projectionMatrix,n.matrixWorldInverse),this._frustum.setFromProjectionMatrix(bd)}},ls=class extends cs{constructor(e,t,n=0,s=2){super(e,t),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new Tl}get power(){return this.intensity*4*Math.PI}set power(e){this.intensity=e/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(e,t){return super.copy(e,t),this.distance=e.distance,this.decay=e.decay,this.shadow=e.shadow.clone(),this}},hs=class extends Jr{constructor(e=-1,t=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-e,o=n+e,a=s+t,c=s-t;if(this.view!==null&&this.view.enabled){let l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,o=r+l*this.view.width,a-=h*this.view.offsetY,c=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,c,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){let t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}},wl=class extends uo{constructor(){super(new hs(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},us=class extends cs{constructor(e,t){super(e,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(ut.DEFAULT_UP),this.updateMatrix(),this.target=new ut,this.shadow=new wl}dispose(){this.shadow.dispose()}copy(e){return super.copy(e),this.target=e.target.clone(),this.shadow=e.shadow.clone(),this}},Ao=class extends cs{constructor(e,t){super(e,t),this.isAmbientLight=!0,this.type="AmbientLight"}};var di=class{static decodeText(e){if(console.warn("THREE.LoaderUtils: decodeText() has been deprecated with r165 and will be removed with r175. Use TextDecoder instead."),typeof TextDecoder<"u")return new TextDecoder().decode(e);let t="";for(let n=0,s=e.length;n<s;n++)t+=String.fromCharCode(e[n]);try{return decodeURIComponent(escape(t))}catch{return t}}static extractUrlBase(e){let t=e.lastIndexOf("/");return t===-1?"./":e.slice(0,t+1)}static resolveURL(e,t){return typeof e!="string"||e===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(e)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(e)||/^data:.*,.*$/i.test(e)||/^blob:.*$/i.test(e)?e:t+e)}};var po=class extends on{constructor(e){super(e),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&console.warn("THREE.ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"}}setOptions(e){return this.options=e,this}load(e,t,n,s){e===void 0&&(e=""),this.path!==void 0&&(e=this.path+e),e=this.manager.resolveURL(e);let r=this,o=oi.get(e);if(o!==void 0){if(r.manager.itemStart(e),o.then){o.then(l=>{t&&t(l),r.manager.itemEnd(e)}).catch(l=>{s&&s(l)});return}return setTimeout(function(){t&&t(o),r.manager.itemEnd(e)},0),o}let a={};a.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",a.headers=this.requestHeader;let c=fetch(e,a).then(function(l){return l.blob()}).then(function(l){return createImageBitmap(l,Object.assign(r.options,{colorSpaceConversion:"none"}))}).then(function(l){return oi.add(e,l),t&&t(l),r.manager.itemEnd(e),l}).catch(function(l){s&&s(l),oi.remove(e),r.manager.itemError(e),r.manager.itemEnd(e)});oi.add(e,c),r.manager.itemStart(e)}};var wa=class extends Mt{constructor(e=[]){super(),this.isArrayCamera=!0,this.cameras=e}};var jl="\\[\\]\\.:\\/",bm=new RegExp("["+jl+"]","g"),$l="[^"+jl+"]",Bm="[^"+jl.replace("\\.","")+"]",Rm=/((?:WC+[\/:])*)/.source.replace("WC",$l),Dm=/(WCOD+)?/.source.replace("WCOD",Bm),Lm=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",$l),Pm=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",$l),Fm=new RegExp("^"+Rm+Dm+Lm+Pm+"$"),Um=["material","materials","bones","map"],bl=class{constructor(e,t,n){let s=n||ct.parseTrackName(t);this._targetGroup=e,this._bindings=e.subscribe_(t,s)}getValue(e,t){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(e,t)}setValue(e,t){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(e,t)}bind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].bind()}unbind(){let e=this._bindings;for(let t=this._targetGroup.nCachedObjects_,n=e.length;t!==n;++t)e[t].unbind()}},ct=class i{constructor(e,t,n){this.path=t,this.parsedPath=n||i.parseTrackName(t),this.node=i.findNode(e,this.parsedPath.nodeName),this.rootNode=e,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(e,t,n){return e&&e.isAnimationObjectGroup?new i.Composite(e,t,n):new i(e,t,n)}static sanitizeNodeName(e){return e.replace(/\s/g,"_").replace(bm,"")}static parseTrackName(e){let t=Fm.exec(e);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+e);let n={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);Um.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+e);return n}static findNode(e,t){if(t===void 0||t===""||t==="."||t===-1||t===e.name||t===e.uuid)return e;if(e.skeleton){let n=e.skeleton.getBoneByName(t);if(n!==void 0)return n}if(e.children){let n=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===t||a.uuid===t)return a;let c=n(a.children);if(c)return c}return null},s=n(e.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(e,t){e[t]=this.targetObject[this.propertyName]}_getValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)e[t++]=n[s]}_getValue_arrayElement(e,t){e[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(e,t){this.resolvedProperty.toArray(e,t)}_setValue_direct(e,t){this.targetObject[this.propertyName]=e[t]}_setValue_direct_setNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(e,t){this.targetObject[this.propertyName]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++]}_setValue_array_setNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(e,t){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=e[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(e,t){this.resolvedProperty[this.propertyIndex]=e[t]}_setValue_arrayElement_setNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty[this.propertyIndex]=e[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(e,t){this.resolvedProperty.fromArray(e,t)}_setValue_fromArray_setNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(e,t){this.resolvedProperty.fromArray(e,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(e,t){this.bind(),this.getValue(e,t)}_setValue_unbound(e,t){this.bind(),this.setValue(e,t)}bind(){let e=this.node,t=this.parsedPath,n=t.objectName,s=t.propertyName,r=t.propertyIndex;if(e||(e=i.findNode(this.rootNode,t.nodeName),this.node=e),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!e){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let l=t.objectIndex;switch(n){case"materials":if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}e=e.material.materials;break;case"bones":if(!e.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}e=e.skeleton.bones;for(let h=0;h<e.length;h++)if(e[h].name===l){l=h;break}break;case"map":if("map"in e){e=e.map;break}if(!e.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!e.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}e=e.material.map;break;default:if(e[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}e=e[n]}if(l!==void 0){if(e[l]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,e);return}e=e[l]}}let o=e[s];if(o===void 0){let l=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+l+"."+s+" but it wasn't found.",e);return}let a=this.Versioning.None;this.targetObject=e,e.isMaterial===!0?a=this.Versioning.NeedsUpdate:e.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!e.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!e.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}e.morphTargetDictionary[r]!==void 0&&(r=e.morphTargetDictionary[r])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};ct.Composite=bl;ct.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};ct.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};ct.prototype.GetterByBindingType=[ct.prototype._getValue_direct,ct.prototype._getValue_array,ct.prototype._getValue_arrayElement,ct.prototype._getValue_toArray];ct.prototype.SetterByBindingTypeAndVersioning=[[ct.prototype._setValue_direct,ct.prototype._setValue_direct_setNeedsUpdate,ct.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[ct.prototype._setValue_array,ct.prototype._setValue_array_setNeedsUpdate,ct.prototype._setValue_array_setMatrixWorldNeedsUpdate],[ct.prototype._setValue_arrayElement,ct.prototype._setValue_arrayElement_setNeedsUpdate,ct.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[ct.prototype._setValue_fromArray,ct.prototype._setValue_fromArray_setNeedsUpdate,ct.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var kC=new Float32Array(1);var Kn=class{constructor(e=1,t=0,n=0){return this.radius=e,this.phi=t,this.theta=n,this}set(e,t,n){return this.radius=e,this.phi=t,this.theta=n,this}copy(e){return this.radius=e.radius,this.phi=e.phi,this.theta=e.theta,this}makeSafe(){return this.phi=Oe(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(e){return this.setFromCartesianCoords(e.x,e.y,e.z)}setFromCartesianCoords(e,t,n){return this.radius=Math.sqrt(e*e+t*t+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(e,n),this.phi=Math.acos(Oe(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var mo=class extends Gn{constructor(e,t=null){super(),this.object=e,this.domElement=t,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(){}disconnect(){}dispose(){}update(){}};function eh(i,e,t,n){let s=Nm(n);switch(t){case kl:return i*e;case Hl:return i*e;case Vl:return i*e*2;case qn:return i*e/s.components*s.byteLength;case Va:return i*e/s.components*s.byteLength;case pi:return i*e*2/s.components*s.byteLength;case za:return i*e*2/s.components*s.byteLength;case Gl:return i*e*3/s.components*s.byteLength;case Tt:return i*e*4/s.components*s.byteLength;case Wa:return i*e*4/s.components*s.byteLength;case _o:case ps:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Eo:case ms:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Ka:case Xa:return Math.max(i,16)*Math.max(e,8)/4;case hr:case ur:return Math.max(i,8)*Math.max(e,8)/2;case dr:case fr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Ar:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case gs:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case qa:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case Ya:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case Ja:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case _s:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case Za:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case ja:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case $a:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case ec:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case tc:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case nc:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case ic:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case sc:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case rc:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case Es:case oc:case pr:return Math.ceil(i/4)*Math.ceil(e/4)*16;case zl:case ac:return Math.ceil(i/4)*Math.ceil(e/4)*8;case cc:case lc:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Nm(i){switch(i){case vt:case Nl:return{byteLength:1,components:1};case lr:case Ol:case mn:return{byteLength:2,components:1};case Ga:case Ha:return{byteLength:2,components:4};case Oi:case ka:case Dt:return{byteLength:4,components:1};case Ql:return{byteLength:4,components:3}}throw new Error(`Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"172"}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="172");function qf(){let i=null,e=!1,t=null,n=null;function s(r,o){t(r,o),n=i.requestAnimationFrame(s)}return{start:function(){e!==!0&&t!==null&&(n=i.requestAnimationFrame(s),e=!0)},stop:function(){i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(r){t=r},setContext:function(r){i=r}}}function Qm(i){let e=new WeakMap;function t(a,c){let l=a.array,h=a.usage,u=l.byteLength,d=i.createBuffer();i.bindBuffer(c,d),i.bufferData(c,l,h),a.onUploadCallback();let f;if(l instanceof Float32Array)f=i.FLOAT;else if(l instanceof Uint16Array)a.isFloat16BufferAttribute?f=i.HALF_FLOAT:f=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)f=i.SHORT;else if(l instanceof Uint32Array)f=i.UNSIGNED_INT;else if(l instanceof Int32Array)f=i.INT;else if(l instanceof Int8Array)f=i.BYTE;else if(l instanceof Uint8Array)f=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)f=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:d,type:f,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:u}}function n(a,c,l){let h=c.array,u=c.updateRanges;if(i.bindBuffer(l,a),u.length===0)i.bufferSubData(l,0,h);else{u.sort((f,m)=>f.start-m.start);let d=0;for(let f=1;f<u.length;f++){let m=u[d],g=u[f];g.start<=m.start+m.count+1?m.count=Math.max(m.count,g.start+g.count-m.start):(++d,u[d]=g)}u.length=d+1;for(let f=0,m=u.length;f<m;f++){let g=u[f];i.bufferSubData(l,g.start*h.BYTES_PER_ELEMENT,h,g.start,g.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),e.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let c=e.get(a);c&&(i.deleteBuffer(c.buffer),e.delete(a))}function o(a,c){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=e.get(a);(!h||h.version<a.version)&&e.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let l=e.get(a);if(l===void 0)e.set(a,t(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,a,c),l.version=a.version}}return{get:s,remove:r,update:o}}var km=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Gm=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Hm=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Vm=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,zm=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Wm=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,Km=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Xm=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,qm=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec3 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 ).rgb;
	}
#endif`,Ym=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,Jm=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,Zm=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,jm=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,$m=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,eg=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,tg=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,ng=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,ig=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,sg=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,rg=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,og=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,ag=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec3 vColor;
#endif`,cg=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif
#ifdef USE_BATCHING_COLOR
	vec3 batchingColor = getBatchingColor( getIndirectIndex( gl_DrawID ) );
	vColor.xyz *= batchingColor.xyz;
#endif`,lg=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,hg=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,ug=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,dg=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,fg=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,Ag=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,pg=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,mg="gl_FragColor = linearToOutputTexel( gl_FragColor );",gg=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,_g=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Eg=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,yg=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,xg=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Cg=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Mg=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Ig=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Sg=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,vg=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Tg=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,wg=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,bg=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Bg=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Rg=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Dg=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,Lg=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Pg=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Fg=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Ug=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Ng=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Og=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	float dispersion;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Qg=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,kg=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Gg=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Hg=`#if defined( USE_LOGDEPTHBUF )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Vg=`#if defined( USE_LOGDEPTHBUF )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,zg=`#ifdef USE_LOGDEPTHBUF
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Wg=`#ifdef USE_LOGDEPTHBUF
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,Kg=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,Xg=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,qg=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,Yg=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Jg=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,Zg=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,jg=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,$g=`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,e_=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,t_=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,n_=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,i_=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,s_=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,r_=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,o_=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,a_=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,c_=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,l_=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,h_=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,u_=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,d_=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,f_=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,A_=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,p_=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,m_=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,g_=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,__=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,E_=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,y_=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,x_=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		
		float lightToPositionLength = length( lightToPosition );
		if ( lightToPositionLength - shadowCameraFar <= 0.0 && lightToPositionLength - shadowCameraNear >= 0.0 ) {
			float dp = ( lightToPositionLength - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
			#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
				vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
				shadow = (
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
					texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
				) * ( 1.0 / 9.0 );
			#else
				shadow = texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
			#endif
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
#endif`,C_=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,M_=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,I_=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,S_=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,v_=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,T_=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,w_=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,b_=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,B_=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,R_=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,D_=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,L_=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,P_=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,F_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,U_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,N_=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,O_=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Q_=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,k_=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,G_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,H_=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,V_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,z_=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,W_=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,K_=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,X_=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,q_=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,Y_=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,J_=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Z_=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,j_=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,$_=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,e0=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,t0=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,n0=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,i0=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,s0=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,r0=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,o0=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,a0=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,c0=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,l0=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,h0=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,u0=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,d0=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,f0=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,A0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,p0=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,m0=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,g0=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,_0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ne={alphahash_fragment:km,alphahash_pars_fragment:Gm,alphamap_fragment:Hm,alphamap_pars_fragment:Vm,alphatest_fragment:zm,alphatest_pars_fragment:Wm,aomap_fragment:Km,aomap_pars_fragment:Xm,batching_pars_vertex:qm,batching_vertex:Ym,begin_vertex:Jm,beginnormal_vertex:Zm,bsdfs:jm,iridescence_fragment:$m,bumpmap_pars_fragment:eg,clipping_planes_fragment:tg,clipping_planes_pars_fragment:ng,clipping_planes_pars_vertex:ig,clipping_planes_vertex:sg,color_fragment:rg,color_pars_fragment:og,color_pars_vertex:ag,color_vertex:cg,common:lg,cube_uv_reflection_fragment:hg,defaultnormal_vertex:ug,displacementmap_pars_vertex:dg,displacementmap_vertex:fg,emissivemap_fragment:Ag,emissivemap_pars_fragment:pg,colorspace_fragment:mg,colorspace_pars_fragment:gg,envmap_fragment:_g,envmap_common_pars_fragment:Eg,envmap_pars_fragment:yg,envmap_pars_vertex:xg,envmap_physical_pars_fragment:Dg,envmap_vertex:Cg,fog_vertex:Mg,fog_pars_vertex:Ig,fog_fragment:Sg,fog_pars_fragment:vg,gradientmap_pars_fragment:Tg,lightmap_pars_fragment:wg,lights_lambert_fragment:bg,lights_lambert_pars_fragment:Bg,lights_pars_begin:Rg,lights_toon_fragment:Lg,lights_toon_pars_fragment:Pg,lights_phong_fragment:Fg,lights_phong_pars_fragment:Ug,lights_physical_fragment:Ng,lights_physical_pars_fragment:Og,lights_fragment_begin:Qg,lights_fragment_maps:kg,lights_fragment_end:Gg,logdepthbuf_fragment:Hg,logdepthbuf_pars_fragment:Vg,logdepthbuf_pars_vertex:zg,logdepthbuf_vertex:Wg,map_fragment:Kg,map_pars_fragment:Xg,map_particle_fragment:qg,map_particle_pars_fragment:Yg,metalnessmap_fragment:Jg,metalnessmap_pars_fragment:Zg,morphinstance_vertex:jg,morphcolor_vertex:$g,morphnormal_vertex:e_,morphtarget_pars_vertex:t_,morphtarget_vertex:n_,normal_fragment_begin:i_,normal_fragment_maps:s_,normal_pars_fragment:r_,normal_pars_vertex:o_,normal_vertex:a_,normalmap_pars_fragment:c_,clearcoat_normal_fragment_begin:l_,clearcoat_normal_fragment_maps:h_,clearcoat_pars_fragment:u_,iridescence_pars_fragment:d_,opaque_fragment:f_,packing:A_,premultiplied_alpha_fragment:p_,project_vertex:m_,dithering_fragment:g_,dithering_pars_fragment:__,roughnessmap_fragment:E_,roughnessmap_pars_fragment:y_,shadowmap_pars_fragment:x_,shadowmap_pars_vertex:C_,shadowmap_vertex:M_,shadowmask_pars_fragment:I_,skinbase_vertex:S_,skinning_pars_vertex:v_,skinning_vertex:T_,skinnormal_vertex:w_,specularmap_fragment:b_,specularmap_pars_fragment:B_,tonemapping_fragment:R_,tonemapping_pars_fragment:D_,transmission_fragment:L_,transmission_pars_fragment:P_,uv_pars_fragment:F_,uv_pars_vertex:U_,uv_vertex:N_,worldpos_vertex:O_,background_vert:Q_,background_frag:k_,backgroundCube_vert:G_,backgroundCube_frag:H_,cube_vert:V_,cube_frag:z_,depth_vert:W_,depth_frag:K_,distanceRGBA_vert:X_,distanceRGBA_frag:q_,equirect_vert:Y_,equirect_frag:J_,linedashed_vert:Z_,linedashed_frag:j_,meshbasic_vert:$_,meshbasic_frag:e0,meshlambert_vert:t0,meshlambert_frag:n0,meshmatcap_vert:i0,meshmatcap_frag:s0,meshnormal_vert:r0,meshnormal_frag:o0,meshphong_vert:a0,meshphong_frag:c0,meshphysical_vert:l0,meshphysical_frag:h0,meshtoon_vert:u0,meshtoon_frag:d0,points_vert:f0,points_frag:A0,shadow_vert:p0,shadow_frag:m0,sprite_vert:g0,sprite_frag:_0},se={common:{diffuse:{value:new Ee(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Le},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Le}},envmap:{envMap:{value:null},envMapRotation:{value:new Le},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Le}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Le}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Le},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Le},normalScale:{value:new ve(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Le},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Le}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Le}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Le}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Ee(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Ee(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0},uvTransform:{value:new Le}},sprite:{diffuse:{value:new Ee(16777215)},opacity:{value:1},center:{value:new ve(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Le},alphaMap:{value:null},alphaMapTransform:{value:new Le},alphaTest:{value:0}}},Yn={basic:{uniforms:Vt([se.common,se.specularmap,se.envmap,se.aomap,se.lightmap,se.fog]),vertexShader:Ne.meshbasic_vert,fragmentShader:Ne.meshbasic_frag},lambert:{uniforms:Vt([se.common,se.specularmap,se.envmap,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.fog,se.lights,{emissive:{value:new Ee(0)}}]),vertexShader:Ne.meshlambert_vert,fragmentShader:Ne.meshlambert_frag},phong:{uniforms:Vt([se.common,se.specularmap,se.envmap,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.fog,se.lights,{emissive:{value:new Ee(0)},specular:{value:new Ee(1118481)},shininess:{value:30}}]),vertexShader:Ne.meshphong_vert,fragmentShader:Ne.meshphong_frag},standard:{uniforms:Vt([se.common,se.envmap,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.roughnessmap,se.metalnessmap,se.fog,se.lights,{emissive:{value:new Ee(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ne.meshphysical_vert,fragmentShader:Ne.meshphysical_frag},toon:{uniforms:Vt([se.common,se.aomap,se.lightmap,se.emissivemap,se.bumpmap,se.normalmap,se.displacementmap,se.gradientmap,se.fog,se.lights,{emissive:{value:new Ee(0)}}]),vertexShader:Ne.meshtoon_vert,fragmentShader:Ne.meshtoon_frag},matcap:{uniforms:Vt([se.common,se.bumpmap,se.normalmap,se.displacementmap,se.fog,{matcap:{value:null}}]),vertexShader:Ne.meshmatcap_vert,fragmentShader:Ne.meshmatcap_frag},points:{uniforms:Vt([se.points,se.fog]),vertexShader:Ne.points_vert,fragmentShader:Ne.points_frag},dashed:{uniforms:Vt([se.common,se.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ne.linedashed_vert,fragmentShader:Ne.linedashed_frag},depth:{uniforms:Vt([se.common,se.displacementmap]),vertexShader:Ne.depth_vert,fragmentShader:Ne.depth_frag},normal:{uniforms:Vt([se.common,se.bumpmap,se.normalmap,se.displacementmap,{opacity:{value:1}}]),vertexShader:Ne.meshnormal_vert,fragmentShader:Ne.meshnormal_frag},sprite:{uniforms:Vt([se.sprite,se.fog]),vertexShader:Ne.sprite_vert,fragmentShader:Ne.sprite_frag},background:{uniforms:{uvTransform:{value:new Le},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ne.background_vert,fragmentShader:Ne.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Le}},vertexShader:Ne.backgroundCube_vert,fragmentShader:Ne.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ne.cube_vert,fragmentShader:Ne.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ne.equirect_vert,fragmentShader:Ne.equirect_frag},distanceRGBA:{uniforms:Vt([se.common,se.displacementmap,{referencePosition:{value:new b},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ne.distanceRGBA_vert,fragmentShader:Ne.distanceRGBA_frag},shadow:{uniforms:Vt([se.lights,se.fog,{color:{value:new Ee(0)},opacity:{value:1}}]),vertexShader:Ne.shadow_vert,fragmentShader:Ne.shadow_frag}};Yn.physical={uniforms:Vt([Yn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Le},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Le},clearcoatNormalScale:{value:new ve(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Le},dispersion:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Le},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Le},sheen:{value:0},sheenColor:{value:new Ee(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Le},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Le},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Le},transmissionSamplerSize:{value:new ve},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Le},attenuationDistance:{value:0},attenuationColor:{value:new Ee(0)},specularColor:{value:new Ee(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Le},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Le},anisotropyVector:{value:new ve},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Le}}]),vertexShader:Ne.meshphysical_vert,fragmentShader:Ne.meshphysical_frag};var hc={r:0,b:0,g:0},Cs=new Un,E0=new Pe;function y0(i,e,t,n,s,r,o){let a=new Ee(0),c=r===!0?0:1,l,h,u=null,d=0,f=null;function m(C){let E=C.isScene===!0?C.background:null;return E&&E.isTexture&&(E=(C.backgroundBlurriness>0?t:e).get(E)),E}function g(C){let E=!1,w=m(C);w===null?A(a,c):w&&w.isColor&&(A(w,1),E=!0);let v=i.xr.getEnvironmentBlendMode();v==="additive"?n.buffers.color.setClear(0,0,0,1,o):v==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,o),(i.autoClear||E)&&(n.buffers.depth.setTest(!0),n.buffers.depth.setMask(!0),n.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function p(C,E){let w=m(E);w&&(w.isCubeTexture||w.mapping===go)?(h===void 0&&(h=new Xe(new Bi(1,1,1),new Nn({name:"BackgroundCubeMaterial",uniforms:xs(Yn.backgroundCube.uniforms),vertexShader:Yn.backgroundCube.vertexShader,fragmentShader:Yn.backgroundCube.fragmentShader,side:Ut,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(v,T,F){this.matrixWorld.copyPosition(F.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),Cs.copy(E.backgroundRotation),Cs.x*=-1,Cs.y*=-1,Cs.z*=-1,w.isCubeTexture&&w.isRenderTargetTexture===!1&&(Cs.y*=-1,Cs.z*=-1),h.material.uniforms.envMap.value=w,h.material.uniforms.flipEnvMap.value=w.isCubeTexture&&w.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=E.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(E0.makeRotationFromEuler(Cs)),h.material.toneMapped=Qe.getTransfer(w.colorSpace)!==it,(u!==w||d!==w.version||f!==i.toneMapping)&&(h.material.needsUpdate=!0,u=w,d=w.version,f=i.toneMapping),h.layers.enableAll(),C.unshift(h,h.geometry,h.material,0,0,null)):w&&w.isTexture&&(l===void 0&&(l=new Xe(new ao(2,2),new Nn({name:"BackgroundMaterial",uniforms:xs(Yn.background.uniforms),vertexShader:Yn.background.vertexShader,fragmentShader:Yn.background.fragmentShader,side:Fn,depthTest:!1,depthWrite:!1,fog:!1})),l.geometry.deleteAttribute("normal"),Object.defineProperty(l.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(l)),l.material.uniforms.t2D.value=w,l.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,l.material.toneMapped=Qe.getTransfer(w.colorSpace)!==it,w.matrixAutoUpdate===!0&&w.updateMatrix(),l.material.uniforms.uvTransform.value.copy(w.matrix),(u!==w||d!==w.version||f!==i.toneMapping)&&(l.material.needsUpdate=!0,u=w,d=w.version,f=i.toneMapping),l.layers.enableAll(),C.unshift(l,l.geometry,l.material,0,0,null))}function A(C,E){C.getRGB(hc,Zl(i)),n.buffers.color.setClear(hc.r,hc.g,hc.b,E,o)}function I(){h!==void 0&&(h.geometry.dispose(),h.material.dispose()),l!==void 0&&(l.geometry.dispose(),l.material.dispose())}return{getClearColor:function(){return a},setClearColor:function(C,E=1){a.set(C),c=E,A(a,c)},getClearAlpha:function(){return c},setClearAlpha:function(C){c=C,A(a,c)},render:g,addToRenderList:p,dispose:I}}function x0(i,e){let t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=d(null),r=s,o=!1;function a(x,R,G,N,H){let Y=!1,z=u(N,G,R);r!==z&&(r=z,l(r.object)),Y=f(x,N,G,H),Y&&m(x,N,G,H),H!==null&&e.update(H,i.ELEMENT_ARRAY_BUFFER),(Y||o)&&(o=!1,E(x,R,G,N),H!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(H).buffer))}function c(){return i.createVertexArray()}function l(x){return i.bindVertexArray(x)}function h(x){return i.deleteVertexArray(x)}function u(x,R,G){let N=G.wireframe===!0,H=n[x.id];H===void 0&&(H={},n[x.id]=H);let Y=H[R.id];Y===void 0&&(Y={},H[R.id]=Y);let z=Y[N];return z===void 0&&(z=d(c()),Y[N]=z),z}function d(x){let R=[],G=[],N=[];for(let H=0;H<t;H++)R[H]=0,G[H]=0,N[H]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:R,enabledAttributes:G,attributeDivisors:N,object:x,attributes:{},index:null}}function f(x,R,G,N){let H=r.attributes,Y=R.attributes,z=0,J=G.getAttributes();for(let k in J)if(J[k].location>=0){let le=H[k],ge=Y[k];if(ge===void 0&&(k==="instanceMatrix"&&x.instanceMatrix&&(ge=x.instanceMatrix),k==="instanceColor"&&x.instanceColor&&(ge=x.instanceColor)),le===void 0||le.attribute!==ge||ge&&le.data!==ge.data)return!0;z++}return r.attributesNum!==z||r.index!==N}function m(x,R,G,N){let H={},Y=R.attributes,z=0,J=G.getAttributes();for(let k in J)if(J[k].location>=0){let le=Y[k];le===void 0&&(k==="instanceMatrix"&&x.instanceMatrix&&(le=x.instanceMatrix),k==="instanceColor"&&x.instanceColor&&(le=x.instanceColor));let ge={};ge.attribute=le,le&&le.data&&(ge.data=le.data),H[k]=ge,z++}r.attributes=H,r.attributesNum=z,r.index=N}function g(){let x=r.newAttributes;for(let R=0,G=x.length;R<G;R++)x[R]=0}function p(x){A(x,0)}function A(x,R){let G=r.newAttributes,N=r.enabledAttributes,H=r.attributeDivisors;G[x]=1,N[x]===0&&(i.enableVertexAttribArray(x),N[x]=1),H[x]!==R&&(i.vertexAttribDivisor(x,R),H[x]=R)}function I(){let x=r.newAttributes,R=r.enabledAttributes;for(let G=0,N=R.length;G<N;G++)R[G]!==x[G]&&(i.disableVertexAttribArray(G),R[G]=0)}function C(x,R,G,N,H,Y,z){z===!0?i.vertexAttribIPointer(x,R,G,H,Y):i.vertexAttribPointer(x,R,G,N,H,Y)}function E(x,R,G,N){g();let H=N.attributes,Y=G.getAttributes(),z=R.defaultAttributeValues;for(let J in Y){let k=Y[J];if(k.location>=0){let te=H[J];if(te===void 0&&(J==="instanceMatrix"&&x.instanceMatrix&&(te=x.instanceMatrix),J==="instanceColor"&&x.instanceColor&&(te=x.instanceColor)),te!==void 0){let le=te.normalized,ge=te.itemSize,Be=e.get(te);if(Be===void 0)continue;let Ve=Be.buffer,W=Be.type,ie=Be.bytesPerElement,_e=W===i.INT||W===i.UNSIGNED_INT||te.gpuType===ka;if(te.isInterleavedBufferAttribute){let ae=te.data,Te=ae.stride,Re=te.offset;if(ae.isInstancedInterleavedBuffer){for(let ke=0;ke<k.locationSize;ke++)A(k.location+ke,ae.meshPerAttribute);x.isInstancedMesh!==!0&&N._maxInstanceCount===void 0&&(N._maxInstanceCount=ae.meshPerAttribute*ae.count)}else for(let ke=0;ke<k.locationSize;ke++)p(k.location+ke);i.bindBuffer(i.ARRAY_BUFFER,Ve);for(let ke=0;ke<k.locationSize;ke++)C(k.location+ke,ge/k.locationSize,W,le,Te*ie,(Re+ge/k.locationSize*ke)*ie,_e)}else{if(te.isInstancedBufferAttribute){for(let ae=0;ae<k.locationSize;ae++)A(k.location+ae,te.meshPerAttribute);x.isInstancedMesh!==!0&&N._maxInstanceCount===void 0&&(N._maxInstanceCount=te.meshPerAttribute*te.count)}else for(let ae=0;ae<k.locationSize;ae++)p(k.location+ae);i.bindBuffer(i.ARRAY_BUFFER,Ve);for(let ae=0;ae<k.locationSize;ae++)C(k.location+ae,ge/k.locationSize,W,le,ge*ie,ge/k.locationSize*ae*ie,_e)}}else if(z!==void 0){let le=z[J];if(le!==void 0)switch(le.length){case 2:i.vertexAttrib2fv(k.location,le);break;case 3:i.vertexAttrib3fv(k.location,le);break;case 4:i.vertexAttrib4fv(k.location,le);break;default:i.vertexAttrib1fv(k.location,le)}}}}I()}function w(){F();for(let x in n){let R=n[x];for(let G in R){let N=R[G];for(let H in N)h(N[H].object),delete N[H];delete R[G]}delete n[x]}}function v(x){if(n[x.id]===void 0)return;let R=n[x.id];for(let G in R){let N=R[G];for(let H in N)h(N[H].object),delete N[H];delete R[G]}delete n[x.id]}function T(x){for(let R in n){let G=n[R];if(G[x.id]===void 0)continue;let N=G[x.id];for(let H in N)h(N[H].object),delete N[H];delete G[x.id]}}function F(){M(),o=!0,r!==s&&(r=s,l(r.object))}function M(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:F,resetDefaultState:M,dispose:w,releaseStatesOfGeometry:v,releaseStatesOfProgram:T,initAttributes:g,enableAttribute:p,disableUnusedAttributes:I}}function C0(i,e,t){let n;function s(l){n=l}function r(l,h){i.drawArrays(n,l,h),t.update(h,n,1)}function o(l,h,u){u!==0&&(i.drawArraysInstanced(n,l,h,u),t.update(h,n,u))}function a(l,h,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,l,0,h,0,u);let f=0;for(let m=0;m<u;m++)f+=h[m];t.update(f,n,1)}function c(l,h,u,d){if(u===0)return;let f=e.get("WEBGL_multi_draw");if(f===null)for(let m=0;m<l.length;m++)o(l[m],h[m],d[m]);else{f.multiDrawArraysInstancedWEBGL(n,l,0,h,0,d,0,u);let m=0;for(let g=0;g<u;g++)m+=h[g]*d[g];t.update(m,n,1)}}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a,this.renderMultiDrawInstances=c}function M0(i,e,t,n){let s;function r(){if(s!==void 0)return s;if(e.has("EXT_texture_filter_anisotropic")===!0){let T=e.get("EXT_texture_filter_anisotropic");s=i.getParameter(T.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(T){return!(T!==Tt&&n.convert(T)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(T){let F=T===mn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(T!==vt&&n.convert(T)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE)&&T!==Dt&&!F)}function c(T){if(T==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";T="mediump"}return T==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=t.precision!==void 0?t.precision:"highp",h=c(l);h!==l&&(console.warn("THREE.WebGLRenderer:",l,"not supported, using",h,"instead."),l=h);let u=t.logarithmicDepthBuffer===!0,d=t.reverseDepthBuffer===!0&&e.has("EXT_clip_control"),f=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),m=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_TEXTURE_SIZE),p=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),A=i.getParameter(i.MAX_VERTEX_ATTRIBS),I=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),C=i.getParameter(i.MAX_VARYING_VECTORS),E=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),w=m>0,v=i.getParameter(i.MAX_SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:u,reverseDepthBuffer:d,maxTextures:f,maxVertexTextures:m,maxTextureSize:g,maxCubemapSize:p,maxAttributes:A,maxVertexUniforms:I,maxVaryings:C,maxFragmentUniforms:E,vertexTextures:w,maxSamples:v}}function I0(i){let e=this,t=null,n=0,s=!1,r=!1,o=new xn,a=new Le,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(u,d){let f=u.length!==0||d||n!==0||s;return s=d,n=u.length,f},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,d){t=h(u,d,0)},this.setState=function(u,d,f){let m=u.clippingPlanes,g=u.clipIntersection,p=u.clipShadows,A=i.get(u);if(!s||m===null||m.length===0||r&&!p)r?h(null):l();else{let I=r?0:n,C=I*4,E=A.clippingState||null;c.value=E,E=h(m,d,C,f);for(let w=0;w!==C;++w)E[w]=t[w];A.clippingState=E,this.numIntersection=g?this.numPlanes:0,this.numPlanes+=I}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function h(u,d,f,m){let g=u!==null?u.length:0,p=null;if(g!==0){if(p=c.value,m!==!0||p===null){let A=f+g*4,I=d.matrixWorldInverse;a.getNormalMatrix(I),(p===null||p.length<A)&&(p=new Float32Array(A));for(let C=0,E=f;C!==g;++C,E+=4)o.copy(u[C]).applyMatrix4(I,a),o.normal.toArray(p,E),p[E+3]=o.constant}c.value=p,c.needsUpdate=!0}return e.numPlanes=g,e.numIntersection=0,p}}function S0(i){let e=new WeakMap;function t(o,a){return a===Ni?o.mapping=Ui:a===Oa&&(o.mapping=ds),o}function n(o){if(o&&o.isTexture){let a=o.mapping;if(a===Ni||a===Oa)if(e.has(o)){let c=e.get(o).texture;return t(c,o.mapping)}else{let c=o.image;if(c&&c.height>0){let l=new ga(c.height);return l.fromEquirectangularTexture(i,o),e.set(o,l),o.addEventListener("dispose",s),t(l.texture,o.mapping)}else return null}}return o}function s(o){let a=o.target;a.removeEventListener("dispose",s);let c=e.get(a);c!==void 0&&(e.delete(a),c.dispose())}function r(){e=new WeakMap}return{get:n,dispose:r}}var _r=4,Sf=[.125,.215,.35,.446,.526,.582],Ss=20,th=new hs,vf=new Ee,nh=null,ih=0,sh=0,rh=!1,Is=(1+Math.sqrt(5))/2,gr=1/Is,Tf=[new b(-Is,gr,0),new b(Is,gr,0),new b(-gr,0,Is),new b(gr,0,Is),new b(0,Is,-gr),new b(0,Is,gr),new b(-1,1,-1),new b(1,1,-1),new b(-1,1,1),new b(1,1,1)],yr=class{constructor(e){this._renderer=e,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(e,t=0,n=.1,s=100){nh=this._renderer.getRenderTarget(),ih=this._renderer.getActiveCubeFace(),sh=this._renderer.getActiveMipmapLevel(),rh=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(e,n,s,r),t>0&&this._blur(r,0,0,t),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Bf(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=bf(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(e){this._lodMax=Math.floor(Math.log2(e)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let e=0;e<this._lodPlanes.length;e++)this._lodPlanes[e].dispose()}_cleanup(e){this._renderer.setRenderTarget(nh,ih,sh),this._renderer.xr.enabled=rh,e.scissorTest=!1,uc(e,0,0,e.width,e.height)}_fromTexture(e,t){e.mapping===Ui||e.mapping===ds?this._setSize(e.image.length===0?16:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4),nh=this._renderer.getRenderTarget(),ih=this._renderer.getActiveCubeFace(),sh=this._renderer.getActiveMipmapLevel(),rh=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=t||this._allocateTargets();return this._textureToCubeUV(e,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let e=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,n={magFilter:It,minFilter:It,generateMipmaps:!1,type:mn,format:Tt,colorSpace:yt,depthBuffer:!1},s=wf(e,t,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==e||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=wf(e,t,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=v0(r)),this._blurMaterial=T0(r,e,t)}return s}_compileMaterial(e){let t=new Xe(this._lodPlanes[0],e);this._renderer.compile(t,th)}_sceneToCubeUV(e,t,n,s){let a=new Mt(90,1,t,n),c=[1,-1,1,1,1,1],l=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,d=h.toneMapping;h.getClearColor(vf),h.toneMapping=Ai,h.autoClear=!1;let f=new en({name:"PMREM.Background",side:Ut,depthWrite:!1,depthTest:!1}),m=new Xe(new Bi,f),g=!1,p=e.background;p?p.isColor&&(f.color.copy(p),e.background=null,g=!0):(f.color.copy(vf),g=!0);for(let A=0;A<6;A++){let I=A%3;I===0?(a.up.set(0,c[A],0),a.lookAt(l[A],0,0)):I===1?(a.up.set(0,0,c[A]),a.lookAt(0,l[A],0)):(a.up.set(0,c[A],0),a.lookAt(0,0,l[A]));let C=this._cubeSize;uc(s,I*C,A>2?C:0,C,C),h.setRenderTarget(s),g&&h.render(m,a),h.render(e,a)}m.geometry.dispose(),m.material.dispose(),h.toneMapping=d,h.autoClear=u,e.background=p}_textureToCubeUV(e,t){let n=this._renderer,s=e.mapping===Ui||e.mapping===ds;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Bf()),this._cubemapMaterial.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=bf());let r=s?this._cubemapMaterial:this._equirectMaterial,o=new Xe(this._lodPlanes[0],r),a=r.uniforms;a.envMap.value=e;let c=this._cubeSize;uc(t,0,0,3*c,2*c),n.setRenderTarget(t),n.render(o,th)}_applyPMREM(e){let t=this._renderer,n=t.autoClear;t.autoClear=!1;let s=this._lodPlanes.length;for(let r=1;r<s;r++){let o=Math.sqrt(this._sigmas[r]*this._sigmas[r]-this._sigmas[r-1]*this._sigmas[r-1]),a=Tf[(s-r-1)%Tf.length];this._blur(e,r-1,r,o,a)}t.autoClear=n}_blur(e,t,n,s,r){let o=this._pingPongRenderTarget;this._halfBlur(e,o,t,n,s,"latitudinal",r),this._halfBlur(o,e,n,n,s,"longitudinal",r)}_halfBlur(e,t,n,s,r,o,a){let c=this._renderer,l=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,u=new Xe(this._lodPlanes[s],l),d=l.uniforms,f=this._sizeLods[n]-1,m=isFinite(r)?Math.PI/(2*f):2*Math.PI/(2*Ss-1),g=r/m,p=isFinite(r)?1+Math.floor(h*g):Ss;p>Ss&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${Ss}`);let A=[],I=0;for(let T=0;T<Ss;++T){let F=T/g,M=Math.exp(-F*F/2);A.push(M),T===0?I+=M:T<p&&(I+=2*M)}for(let T=0;T<A.length;T++)A[T]=A[T]/I;d.envMap.value=e.texture,d.samples.value=p,d.weights.value=A,d.latitudinal.value=o==="latitudinal",a&&(d.poleAxis.value=a);let{_lodMax:C}=this;d.dTheta.value=m,d.mipInt.value=C-n;let E=this._sizeLods[s],w=3*E*(s>C-_r?s-C+_r:0),v=4*(this._cubeSize-E);uc(t,w,v,3*E,2*E),c.setRenderTarget(t),c.render(u,th)}};function v0(i){let e=[],t=[],n=[],s=i,r=i-_r+1+Sf.length;for(let o=0;o<r;o++){let a=Math.pow(2,s);t.push(a);let c=1/a;o>i-_r?c=Sf[o-i+_r-1]:o===0&&(c=0),n.push(c);let l=1/(a-2),h=-l,u=1+l,d=[h,h,u,h,u,u,h,h,u,u,h,u],f=6,m=6,g=3,p=2,A=1,I=new Float32Array(g*m*f),C=new Float32Array(p*m*f),E=new Float32Array(A*m*f);for(let v=0;v<f;v++){let T=v%3*2/3-1,F=v>2?0:-1,M=[T,F,0,T+2/3,F,0,T+2/3,F+1,0,T,F,0,T+2/3,F+1,0,T,F+1,0];I.set(M,g*m*v),C.set(d,p*m*v);let x=[v,v,v,v,v,v];E.set(x,A*m*v)}let w=new Ht;w.setAttribute("position",new pt(I,g)),w.setAttribute("uv",new pt(C,p)),w.setAttribute("faceIndex",new pt(E,A)),e.push(w),s>_r&&s--}return{lodPlanes:e,sizeLods:t,sigmas:n}}function wf(i,e,t){let n=new Hn(i,e,t);return n.texture.mapping=go,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function uc(i,e,t,n,s){i.viewport.set(e,t,n,s),i.scissor.set(e,t,n,s)}function T0(i,e,t){let n=new Float32Array(Ss),s=new b(0,1,0);return new Nn({name:"SphericalGaussianBlur",defines:{n:Ss,CUBEUV_TEXEL_WIDTH:1/e,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:ph(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:fi,depthTest:!1,depthWrite:!1})}function bf(){return new Nn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:ph(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:fi,depthTest:!1,depthWrite:!1})}function Bf(){return new Nn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:ph(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:fi,depthTest:!1,depthWrite:!1})}function ph(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function w0(i){let e=new WeakMap,t=null;function n(a){if(a&&a.isTexture){let c=a.mapping,l=c===Ni||c===Oa,h=c===Ui||c===ds;if(l||h){let u=e.get(a),d=u!==void 0?u.texture.pmremVersion:0;if(a.isRenderTargetTexture&&a.pmremVersion!==d)return t===null&&(t=new yr(i)),u=l?t.fromEquirectangular(a,u):t.fromCubemap(a,u),u.texture.pmremVersion=a.pmremVersion,e.set(a,u),u.texture;if(u!==void 0)return u.texture;{let f=a.image;return l&&f&&f.height>0||h&&f&&s(f)?(t===null&&(t=new yr(i)),u=l?t.fromEquirectangular(a):t.fromCubemap(a),u.texture.pmremVersion=a.pmremVersion,e.set(a,u),a.addEventListener("dispose",r),u.texture):null}}}return a}function s(a){let c=0,l=6;for(let h=0;h<l;h++)a[h]!==void 0&&c++;return c===l}function r(a){let c=a.target;c.removeEventListener("dispose",r);let l=e.get(c);l!==void 0&&(e.delete(c),l.dispose())}function o(){e=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:n,dispose:o}}function b0(i){let e={};function t(n){if(e[n]!==void 0)return e[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return e[n]=s,s}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){let s=t(n);return s===null&&ys("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function B0(i,e,t,n){let s={},r=new WeakMap;function o(u){let d=u.target;d.index!==null&&e.remove(d.index);for(let m in d.attributes)e.remove(d.attributes[m]);d.removeEventListener("dispose",o),delete s[d.id];let f=r.get(d);f&&(e.remove(f),r.delete(d)),n.releaseStatesOfGeometry(d),d.isInstancedBufferGeometry===!0&&delete d._maxInstanceCount,t.memory.geometries--}function a(u,d){return s[d.id]===!0||(d.addEventListener("dispose",o),s[d.id]=!0,t.memory.geometries++),d}function c(u){let d=u.attributes;for(let f in d)e.update(d[f],i.ARRAY_BUFFER)}function l(u){let d=[],f=u.index,m=u.attributes.position,g=0;if(f!==null){let I=f.array;g=f.version;for(let C=0,E=I.length;C<E;C+=3){let w=I[C+0],v=I[C+1],T=I[C+2];d.push(w,v,v,T,T,w)}}else if(m!==void 0){let I=m.array;g=m.version;for(let C=0,E=I.length/3-1;C<E;C+=3){let w=C+0,v=C+1,T=C+2;d.push(w,v,v,T,T,w)}}else return;let p=new(Jl(d)?Yr:qr)(d,1);p.version=g;let A=r.get(u);A&&e.remove(A),r.set(u,p)}function h(u){let d=r.get(u);if(d){let f=u.index;f!==null&&d.version<f.version&&l(u)}else l(u);return r.get(u)}return{get:a,update:c,getWireframeAttribute:h}}function R0(i,e,t){let n;function s(d){n=d}let r,o;function a(d){r=d.type,o=d.bytesPerElement}function c(d,f){i.drawElements(n,f,r,d*o),t.update(f,n,1)}function l(d,f,m){m!==0&&(i.drawElementsInstanced(n,f,r,d*o,m),t.update(f,n,m))}function h(d,f,m){if(m===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,f,0,r,d,0,m);let p=0;for(let A=0;A<m;A++)p+=f[A];t.update(p,n,1)}function u(d,f,m,g){if(m===0)return;let p=e.get("WEBGL_multi_draw");if(p===null)for(let A=0;A<d.length;A++)l(d[A]/o,f[A],g[A]);else{p.multiDrawElementsInstancedWEBGL(n,f,0,r,d,0,g,0,m);let A=0;for(let I=0;I<m;I++)A+=f[I]*g[I];t.update(A,n,1)}}this.setMode=s,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=h,this.renderMultiDrawInstances=u}function D0(i){let e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(t.calls++,o){case i.TRIANGLES:t.triangles+=a*(r/3);break;case i.LINES:t.lines+=a*(r/2);break;case i.LINE_STRIP:t.lines+=a*(r-1);break;case i.LINE_LOOP:t.lines+=a*r;break;case i.POINTS:t.points+=a*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function s(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:s,update:n}}function L0(i,e,t){let n=new WeakMap,s=new je;function r(o,a,c){let l=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,u=h!==void 0?h.length:0,d=n.get(a);if(d===void 0||d.count!==u){let M=function(){T.dispose(),n.delete(a),a.removeEventListener("dispose",M)};d!==void 0&&d.texture.dispose();let f=a.morphAttributes.position!==void 0,m=a.morphAttributes.normal!==void 0,g=a.morphAttributes.color!==void 0,p=a.morphAttributes.position||[],A=a.morphAttributes.normal||[],I=a.morphAttributes.color||[],C=0;f===!0&&(C=1),m===!0&&(C=2),g===!0&&(C=3);let E=a.attributes.position.count*C,w=1;E>e.maxTextureSize&&(w=Math.ceil(E/e.maxTextureSize),E=e.maxTextureSize);let v=new Float32Array(E*w*4*u),T=new Kr(v,E,w,u);T.type=Dt,T.needsUpdate=!0;let F=C*4;for(let x=0;x<u;x++){let R=p[x],G=A[x],N=I[x],H=E*w*4*x;for(let Y=0;Y<R.count;Y++){let z=Y*F;f===!0&&(s.fromBufferAttribute(R,Y),v[H+z+0]=s.x,v[H+z+1]=s.y,v[H+z+2]=s.z,v[H+z+3]=0),m===!0&&(s.fromBufferAttribute(G,Y),v[H+z+4]=s.x,v[H+z+5]=s.y,v[H+z+6]=s.z,v[H+z+7]=0),g===!0&&(s.fromBufferAttribute(N,Y),v[H+z+8]=s.x,v[H+z+9]=s.y,v[H+z+10]=s.z,v[H+z+11]=N.itemSize===4?s.w:1)}}d={count:u,texture:T,size:new ve(E,w)},n.set(a,d),a.addEventListener("dispose",M)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",o.morphTexture,t);else{let f=0;for(let g=0;g<l.length;g++)f+=l[g];let m=a.morphTargetsRelative?1:1-f;c.getUniforms().setValue(i,"morphTargetBaseInfluence",m),c.getUniforms().setValue(i,"morphTargetInfluences",l)}c.getUniforms().setValue(i,"morphTargetsTexture",d.texture,t),c.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:r}}function P0(i,e,t,n){let s=new WeakMap;function r(c){let l=n.render.frame,h=c.geometry,u=e.get(c,h);if(s.get(u)!==l&&(e.update(u),s.set(u,l)),c.isInstancedMesh&&(c.hasEventListener("dispose",a)===!1&&c.addEventListener("dispose",a),s.get(c)!==l&&(t.update(c.instanceMatrix,i.ARRAY_BUFFER),c.instanceColor!==null&&t.update(c.instanceColor,i.ARRAY_BUFFER),s.set(c,l))),c.isSkinnedMesh){let d=c.skeleton;s.get(d)!==l&&(d.update(),s.set(d,l))}return u}function o(){s=new WeakMap}function a(c){let l=c.target;l.removeEventListener("dispose",a),t.remove(l.instanceMatrix),l.instanceColor!==null&&t.remove(l.instanceColor)}return{update:r,dispose:o}}var Yf=new St,Rf=new oo(1,1),Jf=new Kr,Zf=new er,jf=new Zr,Df=[],Lf=[],Pf=new Float32Array(16),Ff=new Float32Array(9),Uf=new Float32Array(4);function xr(i,e,t){let n=i[0];if(n<=0||n>0)return i;let s=e*t,r=Df[s];if(r===void 0&&(r=new Float32Array(s),Df[s]=r),e!==0){n.toArray(r,0);for(let o=1,a=0;o!==e;++o)a+=t,i[o].toArray(r,a)}return r}function wt(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function bt(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function Ac(i,e){let t=Lf[e];t===void 0&&(t=new Int32Array(e),Lf[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function F0(i,e){let t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function U0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(wt(t,e))return;i.uniform2fv(this.addr,e),bt(t,e)}}function N0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(wt(t,e))return;i.uniform3fv(this.addr,e),bt(t,e)}}function O0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(wt(t,e))return;i.uniform4fv(this.addr,e),bt(t,e)}}function Q0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(wt(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),bt(t,e)}else{if(wt(t,n))return;Uf.set(n),i.uniformMatrix2fv(this.addr,!1,Uf),bt(t,n)}}function k0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(wt(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),bt(t,e)}else{if(wt(t,n))return;Ff.set(n),i.uniformMatrix3fv(this.addr,!1,Ff),bt(t,n)}}function G0(i,e){let t=this.cache,n=e.elements;if(n===void 0){if(wt(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),bt(t,e)}else{if(wt(t,n))return;Pf.set(n),i.uniformMatrix4fv(this.addr,!1,Pf),bt(t,n)}}function H0(i,e){let t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function V0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(wt(t,e))return;i.uniform2iv(this.addr,e),bt(t,e)}}function z0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(wt(t,e))return;i.uniform3iv(this.addr,e),bt(t,e)}}function W0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(wt(t,e))return;i.uniform4iv(this.addr,e),bt(t,e)}}function K0(i,e){let t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function X0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(wt(t,e))return;i.uniform2uiv(this.addr,e),bt(t,e)}}function q0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(wt(t,e))return;i.uniform3uiv(this.addr,e),bt(t,e)}}function Y0(i,e){let t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(wt(t,e))return;i.uniform4uiv(this.addr,e),bt(t,e)}}function J0(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Rf.compareFunction=Xl,r=Rf):r=Yf,t.setTexture2D(e||r,s)}function Z0(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture3D(e||Zf,s)}function j0(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTextureCube(e||jf,s)}function $0(i,e,t){let n=this.cache,s=t.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),t.setTexture2DArray(e||Jf,s)}function eE(i){switch(i){case 5126:return F0;case 35664:return U0;case 35665:return N0;case 35666:return O0;case 35674:return Q0;case 35675:return k0;case 35676:return G0;case 5124:case 35670:return H0;case 35667:case 35671:return V0;case 35668:case 35672:return z0;case 35669:case 35673:return W0;case 5125:return K0;case 36294:return X0;case 36295:return q0;case 36296:return Y0;case 35678:case 36198:case 36298:case 36306:case 35682:return J0;case 35679:case 36299:case 36307:return Z0;case 35680:case 36300:case 36308:case 36293:return j0;case 36289:case 36303:case 36311:case 36292:return $0}}function tE(i,e){i.uniform1fv(this.addr,e)}function nE(i,e){let t=xr(e,this.size,2);i.uniform2fv(this.addr,t)}function iE(i,e){let t=xr(e,this.size,3);i.uniform3fv(this.addr,t)}function sE(i,e){let t=xr(e,this.size,4);i.uniform4fv(this.addr,t)}function rE(i,e){let t=xr(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function oE(i,e){let t=xr(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function aE(i,e){let t=xr(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function cE(i,e){i.uniform1iv(this.addr,e)}function lE(i,e){i.uniform2iv(this.addr,e)}function hE(i,e){i.uniform3iv(this.addr,e)}function uE(i,e){i.uniform4iv(this.addr,e)}function dE(i,e){i.uniform1uiv(this.addr,e)}function fE(i,e){i.uniform2uiv(this.addr,e)}function AE(i,e){i.uniform3uiv(this.addr,e)}function pE(i,e){i.uniform4uiv(this.addr,e)}function mE(i,e,t){let n=this.cache,s=e.length,r=Ac(t,s);wt(n,r)||(i.uniform1iv(this.addr,r),bt(n,r));for(let o=0;o!==s;++o)t.setTexture2D(e[o]||Yf,r[o])}function gE(i,e,t){let n=this.cache,s=e.length,r=Ac(t,s);wt(n,r)||(i.uniform1iv(this.addr,r),bt(n,r));for(let o=0;o!==s;++o)t.setTexture3D(e[o]||Zf,r[o])}function _E(i,e,t){let n=this.cache,s=e.length,r=Ac(t,s);wt(n,r)||(i.uniform1iv(this.addr,r),bt(n,r));for(let o=0;o!==s;++o)t.setTextureCube(e[o]||jf,r[o])}function EE(i,e,t){let n=this.cache,s=e.length,r=Ac(t,s);wt(n,r)||(i.uniform1iv(this.addr,r),bt(n,r));for(let o=0;o!==s;++o)t.setTexture2DArray(e[o]||Jf,r[o])}function yE(i){switch(i){case 5126:return tE;case 35664:return nE;case 35665:return iE;case 35666:return sE;case 35674:return rE;case 35675:return oE;case 35676:return aE;case 5124:case 35670:return cE;case 35667:case 35671:return lE;case 35668:case 35672:return hE;case 35669:case 35673:return uE;case 5125:return dE;case 36294:return fE;case 36295:return AE;case 36296:return pE;case 35678:case 36198:case 36298:case 36306:case 35682:return mE;case 35679:case 36299:case 36307:return gE;case 35680:case 36300:case 36308:case 36293:return _E;case 36289:case 36303:case 36311:case 36292:return EE}}var ah=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=eE(t.type)}},ch=class{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=yE(t.type)}},lh=class{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(e,t[a.id],n)}}},oh=/(\w+)(\])?(\[|\.)?/g;function Nf(i,e){i.seq.push(e),i.map[e.id]=e}function xE(i,e,t){let n=i.name,s=n.length;for(oh.lastIndex=0;;){let r=oh.exec(n),o=oh.lastIndex,a=r[1],c=r[2]==="]",l=r[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===s){Nf(t,l===void 0?new ah(a,i,e):new ch(a,i,e));break}else{let u=t.map[a];u===void 0&&(u=new lh(a),Nf(t,u)),t=u}}}var Er=class{constructor(e,t){this.seq=[],this.map={};let n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let r=e.getActiveUniform(t,s),o=e.getUniformLocation(t,r.name);xE(r,o,this)}}setValue(e,t,n,s){let r=this.map[t];r!==void 0&&r.setValue(e,n,s)}setOptional(e,t,n){let s=t[n];s!==void 0&&this.setValue(e,n,s)}static upload(e,t,n,s){for(let r=0,o=t.length;r!==o;++r){let a=t[r],c=n[a.id];c.needsUpdate!==!1&&a.setValue(e,c.value,s)}}static seqWithValue(e,t){let n=[];for(let s=0,r=e.length;s!==r;++s){let o=e[s];o.id in t&&n.push(o)}return n}};function Of(i,e,t){let n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}var CE=37297,ME=0;function IE(i,e){let t=i.split(`
`),n=[],s=Math.max(e-6,0),r=Math.min(e+6,t.length);for(let o=s;o<r;o++){let a=o+1;n.push(`${a===e?">":" "} ${a}: ${t[o]}`)}return n.join(`
`)}var Qf=new Le;function SE(i){Qe._getMatrix(Qf,Qe.workingColorSpace,i);let e=`mat3( ${Qf.elements.map(t=>t.toFixed(4))} )`;switch(Qe.getTransfer(i)){case js:return[e,"LinearTransferOETF"];case it:return[e,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function kf(i,e,t){let n=i.getShaderParameter(e,i.COMPILE_STATUS),s=i.getShaderInfoLog(e).trim();if(n&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let o=parseInt(r[1]);return t.toUpperCase()+`

`+s+`

`+IE(i.getShaderSource(e),o)}else return s}function vE(i,e){let t=SE(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( value.rgb * ${t[0]}, value.a ) );`,"}"].join(`
`)}function TE(i,e){let t;switch(e){case jd:t="Linear";break;case $d:t="Reinhard";break;case ef:t="Cineon";break;case Na:t="ACESFilmic";break;case nf:t="AgX";break;case sf:t="Neutral";break;case tf:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",e),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}var dc=new b;function wE(){Qe.getLuminanceCoefficients(dc);let i=dc.x.toFixed(4),e=dc.y.toFixed(4),t=dc.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function bE(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Co).join(`
`)}function BE(i){let e=[];for(let t in i){let n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function RE(i,e){let t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(e,s),o=r.name,a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),t[o]={type:r.type,location:i.getAttribLocation(e,o),locationSize:a}}return t}function Co(i){return i!==""}function Gf(i,e){let t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows)}function Hf(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}var DE=/^[ \t]*#include +<([\w\d./]+)>/gm;function hh(i){return i.replace(DE,PE)}var LE=new Map;function PE(i,e){let t=Ne[e];if(t===void 0){let n=LE.get(e);if(n!==void 0)t=Ne[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',e,n);else throw new Error("Can not resolve #include <"+e+">")}return hh(t)}var FE=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Vf(i){return i.replace(FE,UE)}function UE(i,e,t,n){let s="";for(let r=parseInt(e);r<parseInt(t);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function zf(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}function NE(i){let e="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===Rl?e="SHADOWMAP_TYPE_PCF":i.shadowMapType===ba?e="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Xn&&(e="SHADOWMAP_TYPE_VSM"),e}function OE(i){let e="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Ui:case ds:e="ENVMAP_TYPE_CUBE";break;case go:e="ENVMAP_TYPE_CUBE_UV";break}return e}function QE(i){let e="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case ds:e="ENVMAP_MODE_REFRACTION";break}return e}function kE(i){let e="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case Fl:e="ENVMAP_BLENDING_MULTIPLY";break;case Jd:e="ENVMAP_BLENDING_MIX";break;case Zd:e="ENVMAP_BLENDING_ADD";break}return e}function GE(i){let e=i.envMapCubeUVHeight;if(e===null)return null;let t=Math.log2(e)-2,n=1/e;return{texelWidth:1/(3*Math.max(Math.pow(2,t),112)),texelHeight:n,maxMip:t}}function HE(i,e,t,n){let s=i.getContext(),r=t.defines,o=t.vertexShader,a=t.fragmentShader,c=NE(t),l=OE(t),h=QE(t),u=kE(t),d=GE(t),f=bE(t),m=BE(r),g=s.createProgram(),p,A,I=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(p=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m].filter(Co).join(`
`),p.length>0&&(p+=`
`),A=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m].filter(Co).join(`
`),A.length>0&&(A+=`
`)):(p=[zf(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+h:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Co).join(`
`),A=[zf(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,m,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+h:"",t.envMap?"#define "+u:"",d?"#define CUBEUV_TEXEL_WIDTH "+d.texelWidth:"",d?"#define CUBEUV_TEXEL_HEIGHT "+d.texelHeight:"",d?"#define CUBEUV_MAX_MIP "+d.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor||t.batchingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.reverseDepthBuffer?"#define USE_REVERSEDEPTHBUF":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==Ai?"#define TONE_MAPPING":"",t.toneMapping!==Ai?Ne.tonemapping_pars_fragment:"",t.toneMapping!==Ai?TE("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ne.colorspace_pars_fragment,vE("linearToOutputTexel",t.outputColorSpace),wE(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Co).join(`
`)),o=hh(o),o=Gf(o,t),o=Hf(o,t),a=hh(a),a=Gf(a,t),a=Hf(a,t),o=Vf(o),a=Vf(a),t.isRawShaderMaterial!==!0&&(I=`#version 300 es
`,p=[f,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+p,A=["#define varying in",t.glslVersion===ql?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===ql?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+A);let C=I+p+o,E=I+A+a,w=Of(s,s.VERTEX_SHADER,C),v=Of(s,s.FRAGMENT_SHADER,E);s.attachShader(g,w),s.attachShader(g,v),t.index0AttributeName!==void 0?s.bindAttribLocation(g,0,t.index0AttributeName):t.morphTargets===!0&&s.bindAttribLocation(g,0,"position"),s.linkProgram(g);function T(R){if(i.debug.checkShaderErrors){let G=s.getProgramInfoLog(g).trim(),N=s.getShaderInfoLog(w).trim(),H=s.getShaderInfoLog(v).trim(),Y=!0,z=!0;if(s.getProgramParameter(g,s.LINK_STATUS)===!1)if(Y=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,g,w,v);else{let J=kf(s,w,"vertex"),k=kf(s,v,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(g,s.VALIDATE_STATUS)+`

Material Name: `+R.name+`
Material Type: `+R.type+`

Program Info Log: `+G+`
`+J+`
`+k)}else G!==""?console.warn("THREE.WebGLProgram: Program Info Log:",G):(N===""||H==="")&&(z=!1);z&&(R.diagnostics={runnable:Y,programLog:G,vertexShader:{log:N,prefix:p},fragmentShader:{log:H,prefix:A}})}s.deleteShader(w),s.deleteShader(v),F=new Er(s,g),M=RE(s,g)}let F;this.getUniforms=function(){return F===void 0&&T(this),F};let M;this.getAttributes=function(){return M===void 0&&T(this),M};let x=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return x===!1&&(x=s.getProgramParameter(g,CE)),x},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(g),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=ME++,this.cacheKey=e,this.usedTimes=1,this.program=g,this.vertexShader=w,this.fragmentShader=v,this}var VE=0,uh=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e){let t=e.vertexShader,n=e.fragmentShader,s=this._getShaderStage(t),r=this._getShaderStage(n),o=this._getShaderCacheForMaterial(e);return o.has(s)===!1&&(o.add(s),s.usedTimes++),o.has(r)===!1&&(o.add(r),r.usedTimes++),this}remove(e){let t=this.materialCache.get(e);for(let n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderID(e){return this._getShaderStage(e.vertexShader).id}getFragmentShaderID(e){return this._getShaderStage(e.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){let t=this.materialCache,n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){let t=this.shaderCache,n=t.get(e);return n===void 0&&(n=new dh(e),t.set(e,n)),n}},dh=class{constructor(e){this.id=VE++,this.code=e,this.usedTimes=0}};function zE(i,e,t,n,s,r,o){let a=new Xr,c=new uh,l=new Set,h=[],u=s.logarithmicDepthBuffer,d=s.vertexTextures,f=s.precision,m={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(M){return l.add(M),M===0?"uv":`uv${M}`}function p(M,x,R,G,N){let H=G.fog,Y=N.geometry,z=M.isMeshStandardMaterial?G.environment:null,J=(M.isMeshStandardMaterial?t:e).get(M.envMap||z),k=J&&J.mapping===go?J.image.height:null,te=m[M.type];M.precision!==null&&(f=s.getMaxPrecision(M.precision),f!==M.precision&&console.warn("THREE.WebGLProgram.getParameters:",M.precision,"not supported, using",f,"instead."));let le=Y.morphAttributes.position||Y.morphAttributes.normal||Y.morphAttributes.color,ge=le!==void 0?le.length:0,Be=0;Y.morphAttributes.position!==void 0&&(Be=1),Y.morphAttributes.normal!==void 0&&(Be=2),Y.morphAttributes.color!==void 0&&(Be=3);let Ve,W,ie,_e;if(te){let st=Yn[te];Ve=st.vertexShader,W=st.fragmentShader}else Ve=M.vertexShader,W=M.fragmentShader,c.update(M),ie=c.getVertexShaderID(M),_e=c.getFragmentShaderID(M);let ae=i.getRenderTarget(),Te=i.state.buffers.depth.getReversed(),Re=N.isInstancedMesh===!0,ke=N.isBatchedMesh===!0,At=!!M.map,qe=!!M.matcap,Et=!!J,B=!!M.aoMap,gn=!!M.lightMap,ze=!!M.bumpMap,We=!!M.normalMap,Ce=!!M.displacementMap,ht=!!M.emissiveMap,xe=!!M.metalnessMap,S=!!M.roughnessMap,_=M.anisotropy>0,U=M.clearcoat>0,X=M.dispersion>0,Z=M.iridescence>0,K=M.sheen>0,ye=M.transmission>0,ce=_&&!!M.anisotropyMap,fe=U&&!!M.clearcoatMap,Ye=U&&!!M.clearcoatNormalMap,ee=U&&!!M.clearcoatRoughnessMap,Ae=Z&&!!M.iridescenceMap,Se=Z&&!!M.iridescenceThicknessMap,we=K&&!!M.sheenColorMap,pe=K&&!!M.sheenRoughnessMap,Ke=!!M.specularMap,Ue=!!M.specularColorMap,lt=!!M.specularIntensityMap,D=ye&&!!M.transmissionMap,re=ye&&!!M.thicknessMap,V=!!M.gradientMap,q=!!M.alphaMap,ue=M.alphaTest>0,he=!!M.alphaHash,Fe=!!M.extensions,gt=Ai;M.toneMapped&&(ae===null||ae.isXRRenderTarget===!0)&&(gt=i.toneMapping);let Ot={shaderID:te,shaderType:M.type,shaderName:M.name,vertexShader:Ve,fragmentShader:W,defines:M.defines,customVertexShaderID:ie,customFragmentShaderID:_e,isRawShaderMaterial:M.isRawShaderMaterial===!0,glslVersion:M.glslVersion,precision:f,batching:ke,batchingColor:ke&&N._colorsTexture!==null,instancing:Re,instancingColor:Re&&N.instanceColor!==null,instancingMorph:Re&&N.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:ae===null?i.outputColorSpace:ae.isXRRenderTarget===!0?ae.texture.colorSpace:yt,alphaToCoverage:!!M.alphaToCoverage,map:At,matcap:qe,envMap:Et,envMapMode:Et&&J.mapping,envMapCubeUVHeight:k,aoMap:B,lightMap:gn,bumpMap:ze,normalMap:We,displacementMap:d&&Ce,emissiveMap:ht,normalMapObjectSpace:We&&M.normalMapType===lf,normalMapTangentSpace:We&&M.normalMapType===Kl,metalnessMap:xe,roughnessMap:S,anisotropy:_,anisotropyMap:ce,clearcoat:U,clearcoatMap:fe,clearcoatNormalMap:Ye,clearcoatRoughnessMap:ee,dispersion:X,iridescence:Z,iridescenceMap:Ae,iridescenceThicknessMap:Se,sheen:K,sheenColorMap:we,sheenRoughnessMap:pe,specularMap:Ke,specularColorMap:Ue,specularIntensityMap:lt,transmission:ye,transmissionMap:D,thicknessMap:re,gradientMap:V,opaque:M.transparent===!1&&M.blending===ji&&M.alphaToCoverage===!1,alphaMap:q,alphaTest:ue,alphaHash:he,combine:M.combine,mapUv:At&&g(M.map.channel),aoMapUv:B&&g(M.aoMap.channel),lightMapUv:gn&&g(M.lightMap.channel),bumpMapUv:ze&&g(M.bumpMap.channel),normalMapUv:We&&g(M.normalMap.channel),displacementMapUv:Ce&&g(M.displacementMap.channel),emissiveMapUv:ht&&g(M.emissiveMap.channel),metalnessMapUv:xe&&g(M.metalnessMap.channel),roughnessMapUv:S&&g(M.roughnessMap.channel),anisotropyMapUv:ce&&g(M.anisotropyMap.channel),clearcoatMapUv:fe&&g(M.clearcoatMap.channel),clearcoatNormalMapUv:Ye&&g(M.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:ee&&g(M.clearcoatRoughnessMap.channel),iridescenceMapUv:Ae&&g(M.iridescenceMap.channel),iridescenceThicknessMapUv:Se&&g(M.iridescenceThicknessMap.channel),sheenColorMapUv:we&&g(M.sheenColorMap.channel),sheenRoughnessMapUv:pe&&g(M.sheenRoughnessMap.channel),specularMapUv:Ke&&g(M.specularMap.channel),specularColorMapUv:Ue&&g(M.specularColorMap.channel),specularIntensityMapUv:lt&&g(M.specularIntensityMap.channel),transmissionMapUv:D&&g(M.transmissionMap.channel),thicknessMapUv:re&&g(M.thicknessMap.channel),alphaMapUv:q&&g(M.alphaMap.channel),vertexTangents:!!Y.attributes.tangent&&(We||_),vertexColors:M.vertexColors,vertexAlphas:M.vertexColors===!0&&!!Y.attributes.color&&Y.attributes.color.itemSize===4,pointsUvs:N.isPoints===!0&&!!Y.attributes.uv&&(At||q),fog:!!H,useFog:M.fog===!0,fogExp2:!!H&&H.isFogExp2,flatShading:M.flatShading===!0,sizeAttenuation:M.sizeAttenuation===!0,logarithmicDepthBuffer:u,reverseDepthBuffer:Te,skinning:N.isSkinnedMesh===!0,morphTargets:Y.morphAttributes.position!==void 0,morphNormals:Y.morphAttributes.normal!==void 0,morphColors:Y.morphAttributes.color!==void 0,morphTargetsCount:ge,morphTextureStride:Be,numDirLights:x.directional.length,numPointLights:x.point.length,numSpotLights:x.spot.length,numSpotLightMaps:x.spotLightMap.length,numRectAreaLights:x.rectArea.length,numHemiLights:x.hemi.length,numDirLightShadows:x.directionalShadowMap.length,numPointLightShadows:x.pointShadowMap.length,numSpotLightShadows:x.spotShadowMap.length,numSpotLightShadowsWithMaps:x.numSpotLightShadowsWithMaps,numLightProbes:x.numLightProbes,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:M.dithering,shadowMapEnabled:i.shadowMap.enabled&&R.length>0,shadowMapType:i.shadowMap.type,toneMapping:gt,decodeVideoTexture:At&&M.map.isVideoTexture===!0&&Qe.getTransfer(M.map.colorSpace)===it,decodeVideoTextureEmissive:ht&&M.emissiveMap.isVideoTexture===!0&&Qe.getTransfer(M.emissiveMap.colorSpace)===it,premultipliedAlpha:M.premultipliedAlpha,doubleSided:M.side===Mn,flipSided:M.side===Ut,useDepthPacking:M.depthPacking>=0,depthPacking:M.depthPacking||0,index0AttributeName:M.index0AttributeName,extensionClipCullDistance:Fe&&M.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(Fe&&M.extensions.multiDraw===!0||ke)&&n.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:M.customProgramCacheKey()};return Ot.vertexUv1s=l.has(1),Ot.vertexUv2s=l.has(2),Ot.vertexUv3s=l.has(3),l.clear(),Ot}function A(M){let x=[];if(M.shaderID?x.push(M.shaderID):(x.push(M.customVertexShaderID),x.push(M.customFragmentShaderID)),M.defines!==void 0)for(let R in M.defines)x.push(R),x.push(M.defines[R]);return M.isRawShaderMaterial===!1&&(I(x,M),C(x,M),x.push(i.outputColorSpace)),x.push(M.customProgramCacheKey),x.join()}function I(M,x){M.push(x.precision),M.push(x.outputColorSpace),M.push(x.envMapMode),M.push(x.envMapCubeUVHeight),M.push(x.mapUv),M.push(x.alphaMapUv),M.push(x.lightMapUv),M.push(x.aoMapUv),M.push(x.bumpMapUv),M.push(x.normalMapUv),M.push(x.displacementMapUv),M.push(x.emissiveMapUv),M.push(x.metalnessMapUv),M.push(x.roughnessMapUv),M.push(x.anisotropyMapUv),M.push(x.clearcoatMapUv),M.push(x.clearcoatNormalMapUv),M.push(x.clearcoatRoughnessMapUv),M.push(x.iridescenceMapUv),M.push(x.iridescenceThicknessMapUv),M.push(x.sheenColorMapUv),M.push(x.sheenRoughnessMapUv),M.push(x.specularMapUv),M.push(x.specularColorMapUv),M.push(x.specularIntensityMapUv),M.push(x.transmissionMapUv),M.push(x.thicknessMapUv),M.push(x.combine),M.push(x.fogExp2),M.push(x.sizeAttenuation),M.push(x.morphTargetsCount),M.push(x.morphAttributeCount),M.push(x.numDirLights),M.push(x.numPointLights),M.push(x.numSpotLights),M.push(x.numSpotLightMaps),M.push(x.numHemiLights),M.push(x.numRectAreaLights),M.push(x.numDirLightShadows),M.push(x.numPointLightShadows),M.push(x.numSpotLightShadows),M.push(x.numSpotLightShadowsWithMaps),M.push(x.numLightProbes),M.push(x.shadowMapType),M.push(x.toneMapping),M.push(x.numClippingPlanes),M.push(x.numClipIntersection),M.push(x.depthPacking)}function C(M,x){a.disableAll(),x.supportsVertexTextures&&a.enable(0),x.instancing&&a.enable(1),x.instancingColor&&a.enable(2),x.instancingMorph&&a.enable(3),x.matcap&&a.enable(4),x.envMap&&a.enable(5),x.normalMapObjectSpace&&a.enable(6),x.normalMapTangentSpace&&a.enable(7),x.clearcoat&&a.enable(8),x.iridescence&&a.enable(9),x.alphaTest&&a.enable(10),x.vertexColors&&a.enable(11),x.vertexAlphas&&a.enable(12),x.vertexUv1s&&a.enable(13),x.vertexUv2s&&a.enable(14),x.vertexUv3s&&a.enable(15),x.vertexTangents&&a.enable(16),x.anisotropy&&a.enable(17),x.alphaHash&&a.enable(18),x.batching&&a.enable(19),x.dispersion&&a.enable(20),x.batchingColor&&a.enable(21),M.push(a.mask),a.disableAll(),x.fog&&a.enable(0),x.useFog&&a.enable(1),x.flatShading&&a.enable(2),x.logarithmicDepthBuffer&&a.enable(3),x.reverseDepthBuffer&&a.enable(4),x.skinning&&a.enable(5),x.morphTargets&&a.enable(6),x.morphNormals&&a.enable(7),x.morphColors&&a.enable(8),x.premultipliedAlpha&&a.enable(9),x.shadowMapEnabled&&a.enable(10),x.doubleSided&&a.enable(11),x.flipSided&&a.enable(12),x.useDepthPacking&&a.enable(13),x.dithering&&a.enable(14),x.transmission&&a.enable(15),x.sheen&&a.enable(16),x.opaque&&a.enable(17),x.pointsUvs&&a.enable(18),x.decodeVideoTexture&&a.enable(19),x.decodeVideoTextureEmissive&&a.enable(20),x.alphaToCoverage&&a.enable(21),M.push(a.mask)}function E(M){let x=m[M.type],R;if(x){let G=Yn[x];R=Cf.clone(G.uniforms)}else R=M.uniforms;return R}function w(M,x){let R;for(let G=0,N=h.length;G<N;G++){let H=h[G];if(H.cacheKey===x){R=H,++R.usedTimes;break}}return R===void 0&&(R=new HE(i,x,M,r),h.push(R)),R}function v(M){if(--M.usedTimes===0){let x=h.indexOf(M);h[x]=h[h.length-1],h.pop(),M.destroy()}}function T(M){c.remove(M)}function F(){c.dispose()}return{getParameters:p,getProgramCacheKey:A,getUniforms:E,acquireProgram:w,releaseProgram:v,releaseShaderCache:T,programs:h,dispose:F}}function WE(){let i=new WeakMap;function e(o){return i.has(o)}function t(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,c){i.get(o)[a]=c}function r(){i=new WeakMap}return{has:e,get:t,remove:n,update:s,dispose:r}}function KE(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.z!==e.z?i.z-e.z:i.id-e.id}function Wf(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function Kf(){let i=[],e=0,t=[],n=[],s=[];function r(){e=0,t.length=0,n.length=0,s.length=0}function o(u,d,f,m,g,p){let A=i[e];return A===void 0?(A={id:u.id,object:u,geometry:d,material:f,groupOrder:m,renderOrder:u.renderOrder,z:g,group:p},i[e]=A):(A.id=u.id,A.object=u,A.geometry=d,A.material=f,A.groupOrder=m,A.renderOrder=u.renderOrder,A.z=g,A.group=p),e++,A}function a(u,d,f,m,g,p){let A=o(u,d,f,m,g,p);f.transmission>0?n.push(A):f.transparent===!0?s.push(A):t.push(A)}function c(u,d,f,m,g,p){let A=o(u,d,f,m,g,p);f.transmission>0?n.unshift(A):f.transparent===!0?s.unshift(A):t.unshift(A)}function l(u,d){t.length>1&&t.sort(u||KE),n.length>1&&n.sort(d||Wf),s.length>1&&s.sort(d||Wf)}function h(){for(let u=e,d=i.length;u<d;u++){let f=i[u];if(f.id===null)break;f.id=null,f.object=null,f.geometry=null,f.material=null,f.group=null}}return{opaque:t,transmissive:n,transparent:s,init:r,push:a,unshift:c,finish:h,sort:l}}function XE(){let i=new WeakMap;function e(n,s){let r=i.get(n),o;return r===void 0?(o=new Kf,i.set(n,[o])):s>=r.length?(o=new Kf,r.push(o)):o=r[s],o}function t(){i=new WeakMap}return{get:e,dispose:t}}function qE(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={direction:new b,color:new Ee};break;case"SpotLight":t={position:new b,direction:new b,color:new Ee,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new b,color:new Ee,distance:0,decay:0};break;case"HemisphereLight":t={direction:new b,skyColor:new Ee,groundColor:new Ee};break;case"RectAreaLight":t={color:new Ee,position:new b,halfWidth:new b,halfHeight:new b};break}return i[e.id]=t,t}}}function YE(){let i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ve};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ve};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new ve,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}var JE=0;function ZE(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function jE(i){let e=new qE,t=YE(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new b);let s=new b,r=new Pe,o=new Pe;function a(l){let h=0,u=0,d=0;for(let M=0;M<9;M++)n.probe[M].set(0,0,0);let f=0,m=0,g=0,p=0,A=0,I=0,C=0,E=0,w=0,v=0,T=0;l.sort(ZE);for(let M=0,x=l.length;M<x;M++){let R=l[M],G=R.color,N=R.intensity,H=R.distance,Y=R.shadow&&R.shadow.map?R.shadow.map.texture:null;if(R.isAmbientLight)h+=G.r*N,u+=G.g*N,d+=G.b*N;else if(R.isLightProbe){for(let z=0;z<9;z++)n.probe[z].addScaledVector(R.sh.coefficients[z],N);T++}else if(R.isDirectionalLight){let z=e.get(R);if(z.color.copy(R.color).multiplyScalar(R.intensity),R.castShadow){let J=R.shadow,k=t.get(R);k.shadowIntensity=J.intensity,k.shadowBias=J.bias,k.shadowNormalBias=J.normalBias,k.shadowRadius=J.radius,k.shadowMapSize=J.mapSize,n.directionalShadow[f]=k,n.directionalShadowMap[f]=Y,n.directionalShadowMatrix[f]=R.shadow.matrix,I++}n.directional[f]=z,f++}else if(R.isSpotLight){let z=e.get(R);z.position.setFromMatrixPosition(R.matrixWorld),z.color.copy(G).multiplyScalar(N),z.distance=H,z.coneCos=Math.cos(R.angle),z.penumbraCos=Math.cos(R.angle*(1-R.penumbra)),z.decay=R.decay,n.spot[g]=z;let J=R.shadow;if(R.map&&(n.spotLightMap[w]=R.map,w++,J.updateMatrices(R),R.castShadow&&v++),n.spotLightMatrix[g]=J.matrix,R.castShadow){let k=t.get(R);k.shadowIntensity=J.intensity,k.shadowBias=J.bias,k.shadowNormalBias=J.normalBias,k.shadowRadius=J.radius,k.shadowMapSize=J.mapSize,n.spotShadow[g]=k,n.spotShadowMap[g]=Y,E++}g++}else if(R.isRectAreaLight){let z=e.get(R);z.color.copy(G).multiplyScalar(N),z.halfWidth.set(R.width*.5,0,0),z.halfHeight.set(0,R.height*.5,0),n.rectArea[p]=z,p++}else if(R.isPointLight){let z=e.get(R);if(z.color.copy(R.color).multiplyScalar(R.intensity),z.distance=R.distance,z.decay=R.decay,R.castShadow){let J=R.shadow,k=t.get(R);k.shadowIntensity=J.intensity,k.shadowBias=J.bias,k.shadowNormalBias=J.normalBias,k.shadowRadius=J.radius,k.shadowMapSize=J.mapSize,k.shadowCameraNear=J.camera.near,k.shadowCameraFar=J.camera.far,n.pointShadow[m]=k,n.pointShadowMap[m]=Y,n.pointShadowMatrix[m]=R.shadow.matrix,C++}n.point[m]=z,m++}else if(R.isHemisphereLight){let z=e.get(R);z.skyColor.copy(R.color).multiplyScalar(N),z.groundColor.copy(R.groundColor).multiplyScalar(N),n.hemi[A]=z,A++}}p>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=se.LTC_FLOAT_1,n.rectAreaLTC2=se.LTC_FLOAT_2):(n.rectAreaLTC1=se.LTC_HALF_1,n.rectAreaLTC2=se.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=u,n.ambient[2]=d;let F=n.hash;(F.directionalLength!==f||F.pointLength!==m||F.spotLength!==g||F.rectAreaLength!==p||F.hemiLength!==A||F.numDirectionalShadows!==I||F.numPointShadows!==C||F.numSpotShadows!==E||F.numSpotMaps!==w||F.numLightProbes!==T)&&(n.directional.length=f,n.spot.length=g,n.rectArea.length=p,n.point.length=m,n.hemi.length=A,n.directionalShadow.length=I,n.directionalShadowMap.length=I,n.pointShadow.length=C,n.pointShadowMap.length=C,n.spotShadow.length=E,n.spotShadowMap.length=E,n.directionalShadowMatrix.length=I,n.pointShadowMatrix.length=C,n.spotLightMatrix.length=E+w-v,n.spotLightMap.length=w,n.numSpotLightShadowsWithMaps=v,n.numLightProbes=T,F.directionalLength=f,F.pointLength=m,F.spotLength=g,F.rectAreaLength=p,F.hemiLength=A,F.numDirectionalShadows=I,F.numPointShadows=C,F.numSpotShadows=E,F.numSpotMaps=w,F.numLightProbes=T,n.version=JE++)}function c(l,h){let u=0,d=0,f=0,m=0,g=0,p=h.matrixWorldInverse;for(let A=0,I=l.length;A<I;A++){let C=l[A];if(C.isDirectionalLight){let E=n.directional[u];E.direction.setFromMatrixPosition(C.matrixWorld),s.setFromMatrixPosition(C.target.matrixWorld),E.direction.sub(s),E.direction.transformDirection(p),u++}else if(C.isSpotLight){let E=n.spot[f];E.position.setFromMatrixPosition(C.matrixWorld),E.position.applyMatrix4(p),E.direction.setFromMatrixPosition(C.matrixWorld),s.setFromMatrixPosition(C.target.matrixWorld),E.direction.sub(s),E.direction.transformDirection(p),f++}else if(C.isRectAreaLight){let E=n.rectArea[m];E.position.setFromMatrixPosition(C.matrixWorld),E.position.applyMatrix4(p),o.identity(),r.copy(C.matrixWorld),r.premultiply(p),o.extractRotation(r),E.halfWidth.set(C.width*.5,0,0),E.halfHeight.set(0,C.height*.5,0),E.halfWidth.applyMatrix4(o),E.halfHeight.applyMatrix4(o),m++}else if(C.isPointLight){let E=n.point[d];E.position.setFromMatrixPosition(C.matrixWorld),E.position.applyMatrix4(p),d++}else if(C.isHemisphereLight){let E=n.hemi[g];E.direction.setFromMatrixPosition(C.matrixWorld),E.direction.transformDirection(p),g++}}}return{setup:a,setupView:c,state:n}}function Xf(i){let e=new jE(i),t=[],n=[];function s(h){l.camera=h,t.length=0,n.length=0}function r(h){t.push(h)}function o(h){n.push(h)}function a(){e.setup(t)}function c(h){e.setupView(t,h)}let l={lightsArray:t,shadowsArray:n,camera:null,lights:e,transmissionRenderTarget:{}};return{init:s,state:l,setupLights:a,setupLightsView:c,pushLight:r,pushShadow:o}}function $E(i){let e=new WeakMap;function t(s,r=0){let o=e.get(s),a;return o===void 0?(a=new Xf(i),e.set(s,[a])):r>=o.length?(a=new Xf(i),o.push(a)):a=o[r],a}function n(){e=new WeakMap}return{get:t,dispose:n}}var ey=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,ty=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function ny(i,e,t){let n=new sr,s=new ve,r=new ve,o=new je,a=new ya({depthPacking:cf}),c=new xa,l={},h=t.maxTextureSize,u={[Fn]:Ut,[Ut]:Fn,[Mn]:Mn},d=new Nn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new ve},radius:{value:4}},vertexShader:ey,fragmentShader:ty}),f=d.clone();f.defines.HORIZONTAL_PASS=1;let m=new Ht;m.setAttribute("position",new pt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let g=new Xe(m,d),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Rl;let A=this.type;this.render=function(v,T,F){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||v.length===0)return;let M=i.getRenderTarget(),x=i.getActiveCubeFace(),R=i.getActiveMipmapLevel(),G=i.state;G.setBlending(fi),G.buffers.color.setClear(1,1,1,1),G.buffers.depth.setTest(!0),G.setScissorTest(!1);let N=A!==Xn&&this.type===Xn,H=A===Xn&&this.type!==Xn;for(let Y=0,z=v.length;Y<z;Y++){let J=v[Y],k=J.shadow;if(k===void 0){console.warn("THREE.WebGLShadowMap:",J,"has no shadow.");continue}if(k.autoUpdate===!1&&k.needsUpdate===!1)continue;s.copy(k.mapSize);let te=k.getFrameExtents();if(s.multiply(te),r.copy(k.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/te.x),s.x=r.x*te.x,k.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/te.y),s.y=r.y*te.y,k.mapSize.y=r.y)),k.map===null||N===!0||H===!0){let ge=this.type!==Xn?{minFilter:Pt,magFilter:Pt}:{};k.map!==null&&k.map.dispose(),k.map=new Hn(s.x,s.y,ge),k.map.texture.name=J.name+".shadowMap",k.camera.updateProjectionMatrix()}i.setRenderTarget(k.map),i.clear();let le=k.getViewportCount();for(let ge=0;ge<le;ge++){let Be=k.getViewport(ge);o.set(r.x*Be.x,r.y*Be.y,r.x*Be.z,r.y*Be.w),G.viewport(o),k.updateMatrices(J,ge),n=k.getFrustum(),E(T,F,k.camera,J,this.type)}k.isPointLightShadow!==!0&&this.type===Xn&&I(k,F),k.needsUpdate=!1}A=this.type,p.needsUpdate=!1,i.setRenderTarget(M,x,R)};function I(v,T){let F=e.update(g);d.defines.VSM_SAMPLES!==v.blurSamples&&(d.defines.VSM_SAMPLES=v.blurSamples,f.defines.VSM_SAMPLES=v.blurSamples,d.needsUpdate=!0,f.needsUpdate=!0),v.mapPass===null&&(v.mapPass=new Hn(s.x,s.y)),d.uniforms.shadow_pass.value=v.map.texture,d.uniforms.resolution.value=v.mapSize,d.uniforms.radius.value=v.radius,i.setRenderTarget(v.mapPass),i.clear(),i.renderBufferDirect(T,null,F,d,g,null),f.uniforms.shadow_pass.value=v.mapPass.texture,f.uniforms.resolution.value=v.mapSize,f.uniforms.radius.value=v.radius,i.setRenderTarget(v.map),i.clear(),i.renderBufferDirect(T,null,F,f,g,null)}function C(v,T,F,M){let x=null,R=F.isPointLight===!0?v.customDistanceMaterial:v.customDepthMaterial;if(R!==void 0)x=R;else if(x=F.isPointLight===!0?c:a,i.localClippingEnabled&&T.clipShadows===!0&&Array.isArray(T.clippingPlanes)&&T.clippingPlanes.length!==0||T.displacementMap&&T.displacementScale!==0||T.alphaMap&&T.alphaTest>0||T.map&&T.alphaTest>0){let G=x.uuid,N=T.uuid,H=l[G];H===void 0&&(H={},l[G]=H);let Y=H[N];Y===void 0&&(Y=x.clone(),H[N]=Y,T.addEventListener("dispose",w)),x=Y}if(x.visible=T.visible,x.wireframe=T.wireframe,M===Xn?x.side=T.shadowSide!==null?T.shadowSide:T.side:x.side=T.shadowSide!==null?T.shadowSide:u[T.side],x.alphaMap=T.alphaMap,x.alphaTest=T.alphaTest,x.map=T.map,x.clipShadows=T.clipShadows,x.clippingPlanes=T.clippingPlanes,x.clipIntersection=T.clipIntersection,x.displacementMap=T.displacementMap,x.displacementScale=T.displacementScale,x.displacementBias=T.displacementBias,x.wireframeLinewidth=T.wireframeLinewidth,x.linewidth=T.linewidth,F.isPointLight===!0&&x.isMeshDistanceMaterial===!0){let G=i.properties.get(x);G.light=F}return x}function E(v,T,F,M,x){if(v.visible===!1)return;if(v.layers.test(T.layers)&&(v.isMesh||v.isLine||v.isPoints)&&(v.castShadow||v.receiveShadow&&x===Xn)&&(!v.frustumCulled||n.intersectsObject(v))){v.modelViewMatrix.multiplyMatrices(F.matrixWorldInverse,v.matrixWorld);let N=e.update(v),H=v.material;if(Array.isArray(H)){let Y=N.groups;for(let z=0,J=Y.length;z<J;z++){let k=Y[z],te=H[k.materialIndex];if(te&&te.visible){let le=C(v,te,M,x);v.onBeforeShadow(i,v,T,F,N,le,k),i.renderBufferDirect(F,null,N,le,v,k),v.onAfterShadow(i,v,T,F,N,le,k)}}}else if(H.visible){let Y=C(v,H,M,x);v.onBeforeShadow(i,v,T,F,N,Y,null),i.renderBufferDirect(F,null,N,Y,v,null),v.onAfterShadow(i,v,T,F,N,Y,null)}}let G=v.children;for(let N=0,H=G.length;N<H;N++)E(G[N],T,F,M,x)}function w(v){v.target.removeEventListener("dispose",w);for(let F in l){let M=l[F],x=v.target.uuid;x in M&&(M[x].dispose(),delete M[x])}}}var iy={[Ba]:Ra,[Da]:Fa,[La]:Ua,[$i]:Pa,[Ra]:Ba,[Fa]:Da,[Ua]:La,[Pa]:$i};function sy(i,e){function t(){let D=!1,re=new je,V=null,q=new je(0,0,0,0);return{setMask:function(ue){V!==ue&&!D&&(i.colorMask(ue,ue,ue,ue),V=ue)},setLocked:function(ue){D=ue},setClear:function(ue,he,Fe,gt,Ot){Ot===!0&&(ue*=gt,he*=gt,Fe*=gt),re.set(ue,he,Fe,gt),q.equals(re)===!1&&(i.clearColor(ue,he,Fe,gt),q.copy(re))},reset:function(){D=!1,V=null,q.set(-1,0,0,0)}}}function n(){let D=!1,re=!1,V=null,q=null,ue=null;return{setReversed:function(he){if(re!==he){let Fe=e.get("EXT_clip_control");re?Fe.clipControlEXT(Fe.LOWER_LEFT_EXT,Fe.ZERO_TO_ONE_EXT):Fe.clipControlEXT(Fe.LOWER_LEFT_EXT,Fe.NEGATIVE_ONE_TO_ONE_EXT);let gt=ue;ue=null,this.setClear(gt)}re=he},getReversed:function(){return re},setTest:function(he){he?ae(i.DEPTH_TEST):Te(i.DEPTH_TEST)},setMask:function(he){V!==he&&!D&&(i.depthMask(he),V=he)},setFunc:function(he){if(re&&(he=iy[he]),q!==he){switch(he){case Ba:i.depthFunc(i.NEVER);break;case Ra:i.depthFunc(i.ALWAYS);break;case Da:i.depthFunc(i.LESS);break;case $i:i.depthFunc(i.LEQUAL);break;case La:i.depthFunc(i.EQUAL);break;case Pa:i.depthFunc(i.GEQUAL);break;case Fa:i.depthFunc(i.GREATER);break;case Ua:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}q=he}},setLocked:function(he){D=he},setClear:function(he){ue!==he&&(re&&(he=1-he),i.clearDepth(he),ue=he)},reset:function(){D=!1,V=null,q=null,ue=null,re=!1}}}function s(){let D=!1,re=null,V=null,q=null,ue=null,he=null,Fe=null,gt=null,Ot=null;return{setTest:function(st){D||(st?ae(i.STENCIL_TEST):Te(i.STENCIL_TEST))},setMask:function(st){re!==st&&!D&&(i.stencilMask(st),re=st)},setFunc:function(st,Tn,$n){(V!==st||q!==Tn||ue!==$n)&&(i.stencilFunc(st,Tn,$n),V=st,q=Tn,ue=$n)},setOp:function(st,Tn,$n){(he!==st||Fe!==Tn||gt!==$n)&&(i.stencilOp(st,Tn,$n),he=st,Fe=Tn,gt=$n)},setLocked:function(st){D=st},setClear:function(st){Ot!==st&&(i.clearStencil(st),Ot=st)},reset:function(){D=!1,re=null,V=null,q=null,ue=null,he=null,Fe=null,gt=null,Ot=null}}}let r=new t,o=new n,a=new s,c=new WeakMap,l=new WeakMap,h={},u={},d=new WeakMap,f=[],m=null,g=!1,p=null,A=null,I=null,C=null,E=null,w=null,v=null,T=new Ee(0,0,0),F=0,M=!1,x=null,R=null,G=null,N=null,H=null,Y=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),z=!1,J=0,k=i.getParameter(i.VERSION);k.indexOf("WebGL")!==-1?(J=parseFloat(/^WebGL (\d)/.exec(k)[1]),z=J>=1):k.indexOf("OpenGL ES")!==-1&&(J=parseFloat(/^OpenGL ES (\d)/.exec(k)[1]),z=J>=2);let te=null,le={},ge=i.getParameter(i.SCISSOR_BOX),Be=i.getParameter(i.VIEWPORT),Ve=new je().fromArray(ge),W=new je().fromArray(Be);function ie(D,re,V,q){let ue=new Uint8Array(4),he=i.createTexture();i.bindTexture(D,he),i.texParameteri(D,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(D,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Fe=0;Fe<V;Fe++)D===i.TEXTURE_3D||D===i.TEXTURE_2D_ARRAY?i.texImage3D(re,0,i.RGBA,1,1,q,0,i.RGBA,i.UNSIGNED_BYTE,ue):i.texImage2D(re+Fe,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,ue);return he}let _e={};_e[i.TEXTURE_2D]=ie(i.TEXTURE_2D,i.TEXTURE_2D,1),_e[i.TEXTURE_CUBE_MAP]=ie(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),_e[i.TEXTURE_2D_ARRAY]=ie(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),_e[i.TEXTURE_3D]=ie(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),ae(i.DEPTH_TEST),o.setFunc($i),ze(!1),We(Bl),ae(i.CULL_FACE),B(fi);function ae(D){h[D]!==!0&&(i.enable(D),h[D]=!0)}function Te(D){h[D]!==!1&&(i.disable(D),h[D]=!1)}function Re(D,re){return u[D]!==re?(i.bindFramebuffer(D,re),u[D]=re,D===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=re),D===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=re),!0):!1}function ke(D,re){let V=f,q=!1;if(D){V=d.get(re),V===void 0&&(V=[],d.set(re,V));let ue=D.textures;if(V.length!==ue.length||V[0]!==i.COLOR_ATTACHMENT0){for(let he=0,Fe=ue.length;he<Fe;he++)V[he]=i.COLOR_ATTACHMENT0+he;V.length=ue.length,q=!0}}else V[0]!==i.BACK&&(V[0]=i.BACK,q=!0);q&&i.drawBuffers(V)}function At(D){return m!==D?(i.useProgram(D),m=D,!0):!1}let qe={[wi]:i.FUNC_ADD,[Ld]:i.FUNC_SUBTRACT,[Pd]:i.FUNC_REVERSE_SUBTRACT};qe[Fd]=i.MIN,qe[Ud]=i.MAX;let Et={[Nd]:i.ZERO,[Od]:i.ONE,[Qd]:i.SRC_COLOR,[ua]:i.SRC_ALPHA,[Wd]:i.SRC_ALPHA_SATURATE,[Vd]:i.DST_COLOR,[Gd]:i.DST_ALPHA,[kd]:i.ONE_MINUS_SRC_COLOR,[da]:i.ONE_MINUS_SRC_ALPHA,[zd]:i.ONE_MINUS_DST_COLOR,[Hd]:i.ONE_MINUS_DST_ALPHA,[Kd]:i.CONSTANT_COLOR,[Xd]:i.ONE_MINUS_CONSTANT_COLOR,[qd]:i.CONSTANT_ALPHA,[Yd]:i.ONE_MINUS_CONSTANT_ALPHA};function B(D,re,V,q,ue,he,Fe,gt,Ot,st){if(D===fi){g===!0&&(Te(i.BLEND),g=!1);return}if(g===!1&&(ae(i.BLEND),g=!0),D!==Dd){if(D!==p||st!==M){if((A!==wi||E!==wi)&&(i.blendEquation(i.FUNC_ADD),A=wi,E=wi),st)switch(D){case ji:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Dl:i.blendFunc(i.ONE,i.ONE);break;case Ll:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Pl:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",D);break}else switch(D){case ji:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Dl:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case Ll:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case Pl:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",D);break}I=null,C=null,w=null,v=null,T.set(0,0,0),F=0,p=D,M=st}return}ue=ue||re,he=he||V,Fe=Fe||q,(re!==A||ue!==E)&&(i.blendEquationSeparate(qe[re],qe[ue]),A=re,E=ue),(V!==I||q!==C||he!==w||Fe!==v)&&(i.blendFuncSeparate(Et[V],Et[q],Et[he],Et[Fe]),I=V,C=q,w=he,v=Fe),(gt.equals(T)===!1||Ot!==F)&&(i.blendColor(gt.r,gt.g,gt.b,Ot),T.copy(gt),F=Ot),p=D,M=!1}function gn(D,re){D.side===Mn?Te(i.CULL_FACE):ae(i.CULL_FACE);let V=D.side===Ut;re&&(V=!V),ze(V),D.blending===ji&&D.transparent===!1?B(fi):B(D.blending,D.blendEquation,D.blendSrc,D.blendDst,D.blendEquationAlpha,D.blendSrcAlpha,D.blendDstAlpha,D.blendColor,D.blendAlpha,D.premultipliedAlpha),o.setFunc(D.depthFunc),o.setTest(D.depthTest),o.setMask(D.depthWrite),r.setMask(D.colorWrite);let q=D.stencilWrite;a.setTest(q),q&&(a.setMask(D.stencilWriteMask),a.setFunc(D.stencilFunc,D.stencilRef,D.stencilFuncMask),a.setOp(D.stencilFail,D.stencilZFail,D.stencilZPass)),ht(D.polygonOffset,D.polygonOffsetFactor,D.polygonOffsetUnits),D.alphaToCoverage===!0?ae(i.SAMPLE_ALPHA_TO_COVERAGE):Te(i.SAMPLE_ALPHA_TO_COVERAGE)}function ze(D){x!==D&&(D?i.frontFace(i.CW):i.frontFace(i.CCW),x=D)}function We(D){D!==Bd?(ae(i.CULL_FACE),D!==R&&(D===Bl?i.cullFace(i.BACK):D===Rd?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Te(i.CULL_FACE),R=D}function Ce(D){D!==G&&(z&&i.lineWidth(D),G=D)}function ht(D,re,V){D?(ae(i.POLYGON_OFFSET_FILL),(N!==re||H!==V)&&(i.polygonOffset(re,V),N=re,H=V)):Te(i.POLYGON_OFFSET_FILL)}function xe(D){D?ae(i.SCISSOR_TEST):Te(i.SCISSOR_TEST)}function S(D){D===void 0&&(D=i.TEXTURE0+Y-1),te!==D&&(i.activeTexture(D),te=D)}function _(D,re,V){V===void 0&&(te===null?V=i.TEXTURE0+Y-1:V=te);let q=le[V];q===void 0&&(q={type:void 0,texture:void 0},le[V]=q),(q.type!==D||q.texture!==re)&&(te!==V&&(i.activeTexture(V),te=V),i.bindTexture(D,re||_e[D]),q.type=D,q.texture=re)}function U(){let D=le[te];D!==void 0&&D.type!==void 0&&(i.bindTexture(D.type,null),D.type=void 0,D.texture=void 0)}function X(){try{i.compressedTexImage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Z(){try{i.compressedTexImage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function K(){try{i.texSubImage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function ye(){try{i.texSubImage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function ce(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function fe(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Ye(){try{i.texStorage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function ee(){try{i.texStorage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Ae(){try{i.texImage2D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function Se(){try{i.texImage3D.apply(i,arguments)}catch(D){console.error("THREE.WebGLState:",D)}}function we(D){Ve.equals(D)===!1&&(i.scissor(D.x,D.y,D.z,D.w),Ve.copy(D))}function pe(D){W.equals(D)===!1&&(i.viewport(D.x,D.y,D.z,D.w),W.copy(D))}function Ke(D,re){let V=l.get(re);V===void 0&&(V=new WeakMap,l.set(re,V));let q=V.get(D);q===void 0&&(q=i.getUniformBlockIndex(re,D.name),V.set(D,q))}function Ue(D,re){let q=l.get(re).get(D);c.get(re)!==q&&(i.uniformBlockBinding(re,q,D.__bindingPointIndex),c.set(re,q))}function lt(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),h={},te=null,le={},u={},d=new WeakMap,f=[],m=null,g=!1,p=null,A=null,I=null,C=null,E=null,w=null,v=null,T=new Ee(0,0,0),F=0,M=!1,x=null,R=null,G=null,N=null,H=null,Ve.set(0,0,i.canvas.width,i.canvas.height),W.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:ae,disable:Te,bindFramebuffer:Re,drawBuffers:ke,useProgram:At,setBlending:B,setMaterial:gn,setFlipSided:ze,setCullFace:We,setLineWidth:Ce,setPolygonOffset:ht,setScissorTest:xe,activeTexture:S,bindTexture:_,unbindTexture:U,compressedTexImage2D:X,compressedTexImage3D:Z,texImage2D:Ae,texImage3D:Se,updateUBOMapping:Ke,uniformBlockBinding:Ue,texStorage2D:Ye,texStorage3D:ee,texSubImage2D:K,texSubImage3D:ye,compressedTexSubImage2D:ce,compressedTexSubImage3D:fe,scissor:we,viewport:pe,reset:lt}}function ry(i,e,t,n,s,r,o){let a=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new ve,h=new WeakMap,u,d=new WeakMap,f=!1;try{f=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function m(S,_){return f?new OffscreenCanvas(S,_):$s("canvas")}function g(S,_,U){let X=1,Z=xe(S);if((Z.width>U||Z.height>U)&&(X=U/Math.max(Z.width,Z.height)),X<1)if(typeof HTMLImageElement<"u"&&S instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&S instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&S instanceof ImageBitmap||typeof VideoFrame<"u"&&S instanceof VideoFrame){let K=Math.floor(X*Z.width),ye=Math.floor(X*Z.height);u===void 0&&(u=m(K,ye));let ce=_?m(K,ye):u;return ce.width=K,ce.height=ye,ce.getContext("2d").drawImage(S,0,0,K,ye),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+Z.width+"x"+Z.height+") to ("+K+"x"+ye+")."),ce}else return"data"in S&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+Z.width+"x"+Z.height+")."),S;return S}function p(S){return S.generateMipmaps}function A(S){i.generateMipmap(S)}function I(S){return S.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:S.isWebGL3DRenderTarget?i.TEXTURE_3D:S.isWebGLArrayRenderTarget||S.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function C(S,_,U,X,Z=!1){if(S!==null){if(i[S]!==void 0)return i[S];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+S+"'")}let K=_;if(_===i.RED&&(U===i.FLOAT&&(K=i.R32F),U===i.HALF_FLOAT&&(K=i.R16F),U===i.UNSIGNED_BYTE&&(K=i.R8)),_===i.RED_INTEGER&&(U===i.UNSIGNED_BYTE&&(K=i.R8UI),U===i.UNSIGNED_SHORT&&(K=i.R16UI),U===i.UNSIGNED_INT&&(K=i.R32UI),U===i.BYTE&&(K=i.R8I),U===i.SHORT&&(K=i.R16I),U===i.INT&&(K=i.R32I)),_===i.RG&&(U===i.FLOAT&&(K=i.RG32F),U===i.HALF_FLOAT&&(K=i.RG16F),U===i.UNSIGNED_BYTE&&(K=i.RG8)),_===i.RG_INTEGER&&(U===i.UNSIGNED_BYTE&&(K=i.RG8UI),U===i.UNSIGNED_SHORT&&(K=i.RG16UI),U===i.UNSIGNED_INT&&(K=i.RG32UI),U===i.BYTE&&(K=i.RG8I),U===i.SHORT&&(K=i.RG16I),U===i.INT&&(K=i.RG32I)),_===i.RGB_INTEGER&&(U===i.UNSIGNED_BYTE&&(K=i.RGB8UI),U===i.UNSIGNED_SHORT&&(K=i.RGB16UI),U===i.UNSIGNED_INT&&(K=i.RGB32UI),U===i.BYTE&&(K=i.RGB8I),U===i.SHORT&&(K=i.RGB16I),U===i.INT&&(K=i.RGB32I)),_===i.RGBA_INTEGER&&(U===i.UNSIGNED_BYTE&&(K=i.RGBA8UI),U===i.UNSIGNED_SHORT&&(K=i.RGBA16UI),U===i.UNSIGNED_INT&&(K=i.RGBA32UI),U===i.BYTE&&(K=i.RGBA8I),U===i.SHORT&&(K=i.RGBA16I),U===i.INT&&(K=i.RGBA32I)),_===i.RGB&&U===i.UNSIGNED_INT_5_9_9_9_REV&&(K=i.RGB9_E5),_===i.RGBA){let ye=Z?js:Qe.getTransfer(X);U===i.FLOAT&&(K=i.RGBA32F),U===i.HALF_FLOAT&&(K=i.RGBA16F),U===i.UNSIGNED_BYTE&&(K=ye===it?i.SRGB8_ALPHA8:i.RGBA8),U===i.UNSIGNED_SHORT_4_4_4_4&&(K=i.RGBA4),U===i.UNSIGNED_SHORT_5_5_5_1&&(K=i.RGB5_A1)}return(K===i.R16F||K===i.R32F||K===i.RG16F||K===i.RG32F||K===i.RGBA16F||K===i.RGBA32F)&&e.get("EXT_color_buffer_float"),K}function E(S,_){let U;return S?_===null||_===Oi||_===As?U=i.DEPTH24_STENCIL8:_===Dt?U=i.DEPTH32F_STENCIL8:_===lr&&(U=i.DEPTH24_STENCIL8,console.warn("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===Oi||_===As?U=i.DEPTH_COMPONENT24:_===Dt?U=i.DEPTH_COMPONENT32F:_===lr&&(U=i.DEPTH_COMPONENT16),U}function w(S,_){return p(S)===!0||S.isFramebufferTexture&&S.minFilter!==Pt&&S.minFilter!==It?Math.log2(Math.max(_.width,_.height))+1:S.mipmaps!==void 0&&S.mipmaps.length>0?S.mipmaps.length:S.isCompressedTexture&&Array.isArray(S.image)?_.mipmaps.length:1}function v(S){let _=S.target;_.removeEventListener("dispose",v),F(_),_.isVideoTexture&&h.delete(_)}function T(S){let _=S.target;_.removeEventListener("dispose",T),x(_)}function F(S){let _=n.get(S);if(_.__webglInit===void 0)return;let U=S.source,X=d.get(U);if(X){let Z=X[_.__cacheKey];Z.usedTimes--,Z.usedTimes===0&&M(S),Object.keys(X).length===0&&d.delete(U)}n.remove(S)}function M(S){let _=n.get(S);i.deleteTexture(_.__webglTexture);let U=S.source,X=d.get(U);delete X[_.__cacheKey],o.memory.textures--}function x(S){let _=n.get(S);if(S.depthTexture&&(S.depthTexture.dispose(),n.remove(S.depthTexture)),S.isWebGLCubeRenderTarget)for(let X=0;X<6;X++){if(Array.isArray(_.__webglFramebuffer[X]))for(let Z=0;Z<_.__webglFramebuffer[X].length;Z++)i.deleteFramebuffer(_.__webglFramebuffer[X][Z]);else i.deleteFramebuffer(_.__webglFramebuffer[X]);_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer[X])}else{if(Array.isArray(_.__webglFramebuffer))for(let X=0;X<_.__webglFramebuffer.length;X++)i.deleteFramebuffer(_.__webglFramebuffer[X]);else i.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&i.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let X=0;X<_.__webglColorRenderbuffer.length;X++)_.__webglColorRenderbuffer[X]&&i.deleteRenderbuffer(_.__webglColorRenderbuffer[X]);_.__webglDepthRenderbuffer&&i.deleteRenderbuffer(_.__webglDepthRenderbuffer)}let U=S.textures;for(let X=0,Z=U.length;X<Z;X++){let K=n.get(U[X]);K.__webglTexture&&(i.deleteTexture(K.__webglTexture),o.memory.textures--),n.remove(U[X])}n.remove(S)}let R=0;function G(){R=0}function N(){let S=R;return S>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+S+" texture units while this GPU supports only "+s.maxTextures),R+=1,S}function H(S){let _=[];return _.push(S.wrapS),_.push(S.wrapT),_.push(S.wrapR||0),_.push(S.magFilter),_.push(S.minFilter),_.push(S.anisotropy),_.push(S.internalFormat),_.push(S.format),_.push(S.type),_.push(S.generateMipmaps),_.push(S.premultiplyAlpha),_.push(S.flipY),_.push(S.unpackAlignment),_.push(S.colorSpace),_.join()}function Y(S,_){let U=n.get(S);if(S.isVideoTexture&&Ce(S),S.isRenderTargetTexture===!1&&S.version>0&&U.__version!==S.version){let X=S.image;if(X===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(X.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{W(U,S,_);return}}t.bindTexture(i.TEXTURE_2D,U.__webglTexture,i.TEXTURE0+_)}function z(S,_){let U=n.get(S);if(S.version>0&&U.__version!==S.version){W(U,S,_);return}t.bindTexture(i.TEXTURE_2D_ARRAY,U.__webglTexture,i.TEXTURE0+_)}function J(S,_){let U=n.get(S);if(S.version>0&&U.__version!==S.version){W(U,S,_);return}t.bindTexture(i.TEXTURE_3D,U.__webglTexture,i.TEXTURE0+_)}function k(S,_){let U=n.get(S);if(S.version>0&&U.__version!==S.version){ie(U,S,_);return}t.bindTexture(i.TEXTURE_CUBE_MAP,U.__webglTexture,i.TEXTURE0+_)}let te={[bi]:i.REPEAT,[Ln]:i.CLAMP_TO_EDGE,[Zs]:i.MIRRORED_REPEAT},le={[Pt]:i.NEAREST,[Qa]:i.NEAREST_MIPMAP_NEAREST,[fs]:i.NEAREST_MIPMAP_LINEAR,[It]:i.LINEAR,[cr]:i.LINEAR_MIPMAP_NEAREST,[an]:i.LINEAR_MIPMAP_LINEAR},ge={[hf]:i.NEVER,[mf]:i.ALWAYS,[uf]:i.LESS,[Xl]:i.LEQUAL,[df]:i.EQUAL,[pf]:i.GEQUAL,[ff]:i.GREATER,[Af]:i.NOTEQUAL};function Be(S,_){if(_.type===Dt&&e.has("OES_texture_float_linear")===!1&&(_.magFilter===It||_.magFilter===cr||_.magFilter===fs||_.magFilter===an||_.minFilter===It||_.minFilter===cr||_.minFilter===fs||_.minFilter===an)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(S,i.TEXTURE_WRAP_S,te[_.wrapS]),i.texParameteri(S,i.TEXTURE_WRAP_T,te[_.wrapT]),(S===i.TEXTURE_3D||S===i.TEXTURE_2D_ARRAY)&&i.texParameteri(S,i.TEXTURE_WRAP_R,te[_.wrapR]),i.texParameteri(S,i.TEXTURE_MAG_FILTER,le[_.magFilter]),i.texParameteri(S,i.TEXTURE_MIN_FILTER,le[_.minFilter]),_.compareFunction&&(i.texParameteri(S,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(S,i.TEXTURE_COMPARE_FUNC,ge[_.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===Pt||_.minFilter!==fs&&_.minFilter!==an||_.type===Dt&&e.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||n.get(_).__currentAnisotropy){let U=e.get("EXT_texture_filter_anisotropic");i.texParameterf(S,U.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,s.getMaxAnisotropy())),n.get(_).__currentAnisotropy=_.anisotropy}}}function Ve(S,_){let U=!1;S.__webglInit===void 0&&(S.__webglInit=!0,_.addEventListener("dispose",v));let X=_.source,Z=d.get(X);Z===void 0&&(Z={},d.set(X,Z));let K=H(_);if(K!==S.__cacheKey){Z[K]===void 0&&(Z[K]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,U=!0),Z[K].usedTimes++;let ye=Z[S.__cacheKey];ye!==void 0&&(Z[S.__cacheKey].usedTimes--,ye.usedTimes===0&&M(_)),S.__cacheKey=K,S.__webglTexture=Z[K].texture}return U}function W(S,_,U){let X=i.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(X=i.TEXTURE_2D_ARRAY),_.isData3DTexture&&(X=i.TEXTURE_3D);let Z=Ve(S,_),K=_.source;t.bindTexture(X,S.__webglTexture,i.TEXTURE0+U);let ye=n.get(K);if(K.version!==ye.__version||Z===!0){t.activeTexture(i.TEXTURE0+U);let ce=Qe.getPrimaries(Qe.workingColorSpace),fe=_.colorSpace===In?null:Qe.getPrimaries(_.colorSpace),Ye=_.colorSpace===In||ce===fe?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ye);let ee=g(_.image,!1,s.maxTextureSize);ee=ht(_,ee);let Ae=r.convert(_.format,_.colorSpace),Se=r.convert(_.type),we=C(_.internalFormat,Ae,Se,_.colorSpace,_.isVideoTexture);Be(X,_);let pe,Ke=_.mipmaps,Ue=_.isVideoTexture!==!0,lt=ye.__version===void 0||Z===!0,D=K.dataReady,re=w(_,ee);if(_.isDepthTexture)we=E(_.format===es,_.type),lt&&(Ue?t.texStorage2D(i.TEXTURE_2D,1,we,ee.width,ee.height):t.texImage2D(i.TEXTURE_2D,0,we,ee.width,ee.height,0,Ae,Se,null));else if(_.isDataTexture)if(Ke.length>0){Ue&&lt&&t.texStorage2D(i.TEXTURE_2D,re,we,Ke[0].width,Ke[0].height);for(let V=0,q=Ke.length;V<q;V++)pe=Ke[V],Ue?D&&t.texSubImage2D(i.TEXTURE_2D,V,0,0,pe.width,pe.height,Ae,Se,pe.data):t.texImage2D(i.TEXTURE_2D,V,we,pe.width,pe.height,0,Ae,Se,pe.data);_.generateMipmaps=!1}else Ue?(lt&&t.texStorage2D(i.TEXTURE_2D,re,we,ee.width,ee.height),D&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,ee.width,ee.height,Ae,Se,ee.data)):t.texImage2D(i.TEXTURE_2D,0,we,ee.width,ee.height,0,Ae,Se,ee.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){Ue&&lt&&t.texStorage3D(i.TEXTURE_2D_ARRAY,re,we,Ke[0].width,Ke[0].height,ee.depth);for(let V=0,q=Ke.length;V<q;V++)if(pe=Ke[V],_.format!==Tt)if(Ae!==null)if(Ue){if(D)if(_.layerUpdates.size>0){let ue=eh(pe.width,pe.height,_.format,_.type);for(let he of _.layerUpdates){let Fe=pe.data.subarray(he*ue/pe.data.BYTES_PER_ELEMENT,(he+1)*ue/pe.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,V,0,0,he,pe.width,pe.height,1,Ae,Fe)}_.clearLayerUpdates()}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,V,0,0,0,pe.width,pe.height,ee.depth,Ae,pe.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,V,we,pe.width,pe.height,ee.depth,0,pe.data,0,0);else console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Ue?D&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,V,0,0,0,pe.width,pe.height,ee.depth,Ae,Se,pe.data):t.texImage3D(i.TEXTURE_2D_ARRAY,V,we,pe.width,pe.height,ee.depth,0,Ae,Se,pe.data)}else{Ue&&lt&&t.texStorage2D(i.TEXTURE_2D,re,we,Ke[0].width,Ke[0].height);for(let V=0,q=Ke.length;V<q;V++)pe=Ke[V],_.format!==Tt?Ae!==null?Ue?D&&t.compressedTexSubImage2D(i.TEXTURE_2D,V,0,0,pe.width,pe.height,Ae,pe.data):t.compressedTexImage2D(i.TEXTURE_2D,V,we,pe.width,pe.height,0,pe.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Ue?D&&t.texSubImage2D(i.TEXTURE_2D,V,0,0,pe.width,pe.height,Ae,Se,pe.data):t.texImage2D(i.TEXTURE_2D,V,we,pe.width,pe.height,0,Ae,Se,pe.data)}else if(_.isDataArrayTexture)if(Ue){if(lt&&t.texStorage3D(i.TEXTURE_2D_ARRAY,re,we,ee.width,ee.height,ee.depth),D)if(_.layerUpdates.size>0){let V=eh(ee.width,ee.height,_.format,_.type);for(let q of _.layerUpdates){let ue=ee.data.subarray(q*V/ee.data.BYTES_PER_ELEMENT,(q+1)*V/ee.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,q,ee.width,ee.height,1,Ae,Se,ue)}_.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,ee.width,ee.height,ee.depth,Ae,Se,ee.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,we,ee.width,ee.height,ee.depth,0,Ae,Se,ee.data);else if(_.isData3DTexture)Ue?(lt&&t.texStorage3D(i.TEXTURE_3D,re,we,ee.width,ee.height,ee.depth),D&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,ee.width,ee.height,ee.depth,Ae,Se,ee.data)):t.texImage3D(i.TEXTURE_3D,0,we,ee.width,ee.height,ee.depth,0,Ae,Se,ee.data);else if(_.isFramebufferTexture){if(lt)if(Ue)t.texStorage2D(i.TEXTURE_2D,re,we,ee.width,ee.height);else{let V=ee.width,q=ee.height;for(let ue=0;ue<re;ue++)t.texImage2D(i.TEXTURE_2D,ue,we,V,q,0,Ae,Se,null),V>>=1,q>>=1}}else if(Ke.length>0){if(Ue&&lt){let V=xe(Ke[0]);t.texStorage2D(i.TEXTURE_2D,re,we,V.width,V.height)}for(let V=0,q=Ke.length;V<q;V++)pe=Ke[V],Ue?D&&t.texSubImage2D(i.TEXTURE_2D,V,0,0,Ae,Se,pe):t.texImage2D(i.TEXTURE_2D,V,we,Ae,Se,pe);_.generateMipmaps=!1}else if(Ue){if(lt){let V=xe(ee);t.texStorage2D(i.TEXTURE_2D,re,we,V.width,V.height)}D&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,Ae,Se,ee)}else t.texImage2D(i.TEXTURE_2D,0,we,Ae,Se,ee);p(_)&&A(X),ye.__version=K.version,_.onUpdate&&_.onUpdate(_)}S.__version=_.version}function ie(S,_,U){if(_.image.length!==6)return;let X=Ve(S,_),Z=_.source;t.bindTexture(i.TEXTURE_CUBE_MAP,S.__webglTexture,i.TEXTURE0+U);let K=n.get(Z);if(Z.version!==K.__version||X===!0){t.activeTexture(i.TEXTURE0+U);let ye=Qe.getPrimaries(Qe.workingColorSpace),ce=_.colorSpace===In?null:Qe.getPrimaries(_.colorSpace),fe=_.colorSpace===In||ye===ce?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,fe);let Ye=_.isCompressedTexture||_.image[0].isCompressedTexture,ee=_.image[0]&&_.image[0].isDataTexture,Ae=[];for(let q=0;q<6;q++)!Ye&&!ee?Ae[q]=g(_.image[q],!0,s.maxCubemapSize):Ae[q]=ee?_.image[q].image:_.image[q],Ae[q]=ht(_,Ae[q]);let Se=Ae[0],we=r.convert(_.format,_.colorSpace),pe=r.convert(_.type),Ke=C(_.internalFormat,we,pe,_.colorSpace),Ue=_.isVideoTexture!==!0,lt=K.__version===void 0||X===!0,D=Z.dataReady,re=w(_,Se);Be(i.TEXTURE_CUBE_MAP,_);let V;if(Ye){Ue&&lt&&t.texStorage2D(i.TEXTURE_CUBE_MAP,re,Ke,Se.width,Se.height);for(let q=0;q<6;q++){V=Ae[q].mipmaps;for(let ue=0;ue<V.length;ue++){let he=V[ue];_.format!==Tt?we!==null?Ue?D&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,ue,0,0,he.width,he.height,we,he.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,ue,Ke,he.width,he.height,0,he.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Ue?D&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,ue,0,0,he.width,he.height,we,pe,he.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,ue,Ke,he.width,he.height,0,we,pe,he.data)}}}else{if(V=_.mipmaps,Ue&&lt){V.length>0&&re++;let q=xe(Ae[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,re,Ke,q.width,q.height)}for(let q=0;q<6;q++)if(ee){Ue?D&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,0,0,0,Ae[q].width,Ae[q].height,we,pe,Ae[q].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,0,Ke,Ae[q].width,Ae[q].height,0,we,pe,Ae[q].data);for(let ue=0;ue<V.length;ue++){let Fe=V[ue].image[q].image;Ue?D&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,ue+1,0,0,Fe.width,Fe.height,we,pe,Fe.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,ue+1,Ke,Fe.width,Fe.height,0,we,pe,Fe.data)}}else{Ue?D&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,0,0,0,we,pe,Ae[q]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,0,Ke,we,pe,Ae[q]);for(let ue=0;ue<V.length;ue++){let he=V[ue];Ue?D&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,ue+1,0,0,we,pe,he.image[q]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,ue+1,Ke,we,pe,he.image[q])}}}p(_)&&A(i.TEXTURE_CUBE_MAP),K.__version=Z.version,_.onUpdate&&_.onUpdate(_)}S.__version=_.version}function _e(S,_,U,X,Z,K){let ye=r.convert(U.format,U.colorSpace),ce=r.convert(U.type),fe=C(U.internalFormat,ye,ce,U.colorSpace),Ye=n.get(_),ee=n.get(U);if(ee.__renderTarget=_,!Ye.__hasExternalTextures){let Ae=Math.max(1,_.width>>K),Se=Math.max(1,_.height>>K);Z===i.TEXTURE_3D||Z===i.TEXTURE_2D_ARRAY?t.texImage3D(Z,K,fe,Ae,Se,_.depth,0,ye,ce,null):t.texImage2D(Z,K,fe,Ae,Se,0,ye,ce,null)}t.bindFramebuffer(i.FRAMEBUFFER,S),We(_)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,X,Z,ee.__webglTexture,0,ze(_)):(Z===i.TEXTURE_2D||Z>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&Z<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,X,Z,ee.__webglTexture,K),t.bindFramebuffer(i.FRAMEBUFFER,null)}function ae(S,_,U){if(i.bindRenderbuffer(i.RENDERBUFFER,S),_.depthBuffer){let X=_.depthTexture,Z=X&&X.isDepthTexture?X.type:null,K=E(_.stencilBuffer,Z),ye=_.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ce=ze(_);We(_)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ce,K,_.width,_.height):U?i.renderbufferStorageMultisample(i.RENDERBUFFER,ce,K,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,K,_.width,_.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,ye,i.RENDERBUFFER,S)}else{let X=_.textures;for(let Z=0;Z<X.length;Z++){let K=X[Z],ye=r.convert(K.format,K.colorSpace),ce=r.convert(K.type),fe=C(K.internalFormat,ye,ce,K.colorSpace),Ye=ze(_);U&&We(_)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,Ye,fe,_.width,_.height):We(_)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,Ye,fe,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,fe,_.width,_.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Te(S,_){if(_&&_.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,S),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");let X=n.get(_.depthTexture);X.__renderTarget=_,(!X.__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),Y(_.depthTexture,0);let Z=X.__webglTexture,K=ze(_);if(_.depthTexture.format===Zi)We(_)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Z,0,K):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,Z,0);else if(_.depthTexture.format===es)We(_)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Z,0,K):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,Z,0);else throw new Error("Unknown depthTexture format")}function Re(S){let _=n.get(S),U=S.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==S.depthTexture){let X=S.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),X){let Z=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,X.removeEventListener("dispose",Z)};X.addEventListener("dispose",Z),_.__depthDisposeCallback=Z}_.__boundDepthTexture=X}if(S.depthTexture&&!_.__autoAllocateDepthBuffer){if(U)throw new Error("target.depthTexture not supported in Cube render targets");Te(_.__webglFramebuffer,S)}else if(U){_.__webglDepthbuffer=[];for(let X=0;X<6;X++)if(t.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[X]),_.__webglDepthbuffer[X]===void 0)_.__webglDepthbuffer[X]=i.createRenderbuffer(),ae(_.__webglDepthbuffer[X],S,!1);else{let Z=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,K=_.__webglDepthbuffer[X];i.bindRenderbuffer(i.RENDERBUFFER,K),i.framebufferRenderbuffer(i.FRAMEBUFFER,Z,i.RENDERBUFFER,K)}}else if(t.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=i.createRenderbuffer(),ae(_.__webglDepthbuffer,S,!1);else{let X=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Z=_.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,Z),i.framebufferRenderbuffer(i.FRAMEBUFFER,X,i.RENDERBUFFER,Z)}t.bindFramebuffer(i.FRAMEBUFFER,null)}function ke(S,_,U){let X=n.get(S);_!==void 0&&_e(X.__webglFramebuffer,S,S.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),U!==void 0&&Re(S)}function At(S){let _=S.texture,U=n.get(S),X=n.get(_);S.addEventListener("dispose",T);let Z=S.textures,K=S.isWebGLCubeRenderTarget===!0,ye=Z.length>1;if(ye||(X.__webglTexture===void 0&&(X.__webglTexture=i.createTexture()),X.__version=_.version,o.memory.textures++),K){U.__webglFramebuffer=[];for(let ce=0;ce<6;ce++)if(_.mipmaps&&_.mipmaps.length>0){U.__webglFramebuffer[ce]=[];for(let fe=0;fe<_.mipmaps.length;fe++)U.__webglFramebuffer[ce][fe]=i.createFramebuffer()}else U.__webglFramebuffer[ce]=i.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){U.__webglFramebuffer=[];for(let ce=0;ce<_.mipmaps.length;ce++)U.__webglFramebuffer[ce]=i.createFramebuffer()}else U.__webglFramebuffer=i.createFramebuffer();if(ye)for(let ce=0,fe=Z.length;ce<fe;ce++){let Ye=n.get(Z[ce]);Ye.__webglTexture===void 0&&(Ye.__webglTexture=i.createTexture(),o.memory.textures++)}if(S.samples>0&&We(S)===!1){U.__webglMultisampledFramebuffer=i.createFramebuffer(),U.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,U.__webglMultisampledFramebuffer);for(let ce=0;ce<Z.length;ce++){let fe=Z[ce];U.__webglColorRenderbuffer[ce]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,U.__webglColorRenderbuffer[ce]);let Ye=r.convert(fe.format,fe.colorSpace),ee=r.convert(fe.type),Ae=C(fe.internalFormat,Ye,ee,fe.colorSpace,S.isXRRenderTarget===!0),Se=ze(S);i.renderbufferStorageMultisample(i.RENDERBUFFER,Se,Ae,S.width,S.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ce,i.RENDERBUFFER,U.__webglColorRenderbuffer[ce])}i.bindRenderbuffer(i.RENDERBUFFER,null),S.depthBuffer&&(U.__webglDepthRenderbuffer=i.createRenderbuffer(),ae(U.__webglDepthRenderbuffer,S,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(K){t.bindTexture(i.TEXTURE_CUBE_MAP,X.__webglTexture),Be(i.TEXTURE_CUBE_MAP,_);for(let ce=0;ce<6;ce++)if(_.mipmaps&&_.mipmaps.length>0)for(let fe=0;fe<_.mipmaps.length;fe++)_e(U.__webglFramebuffer[ce][fe],S,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ce,fe);else _e(U.__webglFramebuffer[ce],S,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+ce,0);p(_)&&A(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(ye){for(let ce=0,fe=Z.length;ce<fe;ce++){let Ye=Z[ce],ee=n.get(Ye);t.bindTexture(i.TEXTURE_2D,ee.__webglTexture),Be(i.TEXTURE_2D,Ye),_e(U.__webglFramebuffer,S,Ye,i.COLOR_ATTACHMENT0+ce,i.TEXTURE_2D,0),p(Ye)&&A(i.TEXTURE_2D)}t.unbindTexture()}else{let ce=i.TEXTURE_2D;if((S.isWebGL3DRenderTarget||S.isWebGLArrayRenderTarget)&&(ce=S.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(ce,X.__webglTexture),Be(ce,_),_.mipmaps&&_.mipmaps.length>0)for(let fe=0;fe<_.mipmaps.length;fe++)_e(U.__webglFramebuffer[fe],S,_,i.COLOR_ATTACHMENT0,ce,fe);else _e(U.__webglFramebuffer,S,_,i.COLOR_ATTACHMENT0,ce,0);p(_)&&A(ce),t.unbindTexture()}S.depthBuffer&&Re(S)}function qe(S){let _=S.textures;for(let U=0,X=_.length;U<X;U++){let Z=_[U];if(p(Z)){let K=I(S),ye=n.get(Z).__webglTexture;t.bindTexture(K,ye),A(K),t.unbindTexture()}}}let Et=[],B=[];function gn(S){if(S.samples>0){if(We(S)===!1){let _=S.textures,U=S.width,X=S.height,Z=i.COLOR_BUFFER_BIT,K=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ye=n.get(S),ce=_.length>1;if(ce)for(let fe=0;fe<_.length;fe++)t.bindFramebuffer(i.FRAMEBUFFER,ye.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+fe,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,ye.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+fe,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,ye.__webglMultisampledFramebuffer),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ye.__webglFramebuffer);for(let fe=0;fe<_.length;fe++){if(S.resolveDepthBuffer&&(S.depthBuffer&&(Z|=i.DEPTH_BUFFER_BIT),S.stencilBuffer&&S.resolveStencilBuffer&&(Z|=i.STENCIL_BUFFER_BIT)),ce){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,ye.__webglColorRenderbuffer[fe]);let Ye=n.get(_[fe]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Ye,0)}i.blitFramebuffer(0,0,U,X,0,0,U,X,Z,i.NEAREST),c===!0&&(Et.length=0,B.length=0,Et.push(i.COLOR_ATTACHMENT0+fe),S.depthBuffer&&S.resolveDepthBuffer===!1&&(Et.push(K),B.push(K),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,B)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,Et))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),ce)for(let fe=0;fe<_.length;fe++){t.bindFramebuffer(i.FRAMEBUFFER,ye.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+fe,i.RENDERBUFFER,ye.__webglColorRenderbuffer[fe]);let Ye=n.get(_[fe]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,ye.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+fe,i.TEXTURE_2D,Ye,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ye.__webglMultisampledFramebuffer)}else if(S.depthBuffer&&S.resolveDepthBuffer===!1&&c){let _=S.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[_])}}}function ze(S){return Math.min(s.maxSamples,S.samples)}function We(S){let _=n.get(S);return S.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function Ce(S){let _=o.render.frame;h.get(S)!==_&&(h.set(S,_),S.update())}function ht(S,_){let U=S.colorSpace,X=S.format,Z=S.type;return S.isCompressedTexture===!0||S.isVideoTexture===!0||U!==yt&&U!==In&&(Qe.getTransfer(U)===it?(X!==Tt||Z!==vt)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",U)),_}function xe(S){return typeof HTMLImageElement<"u"&&S instanceof HTMLImageElement?(l.width=S.naturalWidth||S.width,l.height=S.naturalHeight||S.height):typeof VideoFrame<"u"&&S instanceof VideoFrame?(l.width=S.displayWidth,l.height=S.displayHeight):(l.width=S.width,l.height=S.height),l}this.allocateTextureUnit=N,this.resetTextureUnits=G,this.setTexture2D=Y,this.setTexture2DArray=z,this.setTexture3D=J,this.setTextureCube=k,this.rebindTextures=ke,this.setupRenderTarget=At,this.updateRenderTargetMipmap=qe,this.updateMultisampleRenderTarget=gn,this.setupDepthRenderbuffer=Re,this.setupFrameBufferTexture=_e,this.useMultisampledRTT=We}function oy(i,e){function t(n,s=In){let r,o=Qe.getTransfer(s);if(n===vt)return i.UNSIGNED_BYTE;if(n===Ga)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Ha)return i.UNSIGNED_SHORT_5_5_5_1;if(n===Ql)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===Nl)return i.BYTE;if(n===Ol)return i.SHORT;if(n===lr)return i.UNSIGNED_SHORT;if(n===ka)return i.INT;if(n===Oi)return i.UNSIGNED_INT;if(n===Dt)return i.FLOAT;if(n===mn)return i.HALF_FLOAT;if(n===kl)return i.ALPHA;if(n===Gl)return i.RGB;if(n===Tt)return i.RGBA;if(n===Hl)return i.LUMINANCE;if(n===Vl)return i.LUMINANCE_ALPHA;if(n===Zi)return i.DEPTH_COMPONENT;if(n===es)return i.DEPTH_STENCIL;if(n===qn)return i.RED;if(n===Va)return i.RED_INTEGER;if(n===pi)return i.RG;if(n===za)return i.RG_INTEGER;if(n===Wa)return i.RGBA_INTEGER;if(n===_o||n===ps||n===Eo||n===ms)if(o===it)if(r=e.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===_o)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===ps)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Eo)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===ms)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=e.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===_o)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===ps)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Eo)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===ms)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===hr||n===Ka||n===ur||n===Xa)if(r=e.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===hr)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Ka)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===ur)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Xa)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===dr||n===fr||n===Ar)if(r=e.get("WEBGL_compressed_texture_etc"),r!==null){if(n===dr||n===fr)return o===it?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===Ar)return o===it?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(n===gs||n===qa||n===Ya||n===Ja||n===_s||n===Za||n===ja||n===$a||n===ec||n===tc||n===nc||n===ic||n===sc||n===rc)if(r=e.get("WEBGL_compressed_texture_astc"),r!==null){if(n===gs)return o===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===qa)return o===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Ya)return o===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Ja)return o===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===_s)return o===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Za)return o===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===ja)return o===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===$a)return o===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===ec)return o===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===tc)return o===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===nc)return o===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===ic)return o===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===sc)return o===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===rc)return o===it?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Es||n===oc||n===pr)if(r=e.get("EXT_texture_compression_bptc"),r!==null){if(n===Es)return o===it?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===oc)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===pr)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===zl||n===ac||n===cc||n===lc)if(r=e.get("EXT_texture_compression_rgtc"),r!==null){if(n===Es)return r.COMPRESSED_RED_RGTC1_EXT;if(n===ac)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===cc)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===lc)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===As?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}var ay={type:"move"},Mo=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new fn,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new fn,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new b,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new b),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new fn,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new b,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new b),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){let t=this._hand;if(t)for(let n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let s=null,r=null,o=null,a=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){o=!0;for(let g of e.hand.values()){let p=t.getJointPose(g,n),A=this._getHandJoint(l,g);p!==null&&(A.matrix.fromArray(p.transform.matrix),A.matrix.decompose(A.position,A.rotation,A.scale),A.matrixWorldNeedsUpdate=!0,A.jointRadius=p.radius),A.visible=p!==null}let h=l.joints["index-finger-tip"],u=l.joints["thumb-tip"],d=h.position.distanceTo(u.position),f=.02,m=.005;l.inputState.pinching&&d>f+m?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&d<=f-m&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(r=t.getPose(e.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1));a!==null&&(s=t.getPose(e.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(ay)))}return a!==null&&(a.visible=s!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){let n=new fn;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}},cy=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,ly=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,fh=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t,n){if(this.texture===null){let s=new St,r=e.properties.get(s);r.__webglTexture=t.texture,(t.depthNear!==n.depthNear||t.depthFar!==n.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=s}}getMesh(e){if(this.texture!==null&&this.mesh===null){let t=e.cameras[0].viewport,n=new Nn({vertexShader:cy,fragmentShader:ly,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Xe(new ao(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Ah=class extends Gn{constructor(e,t){super();let n=this,s=null,r=1,o=null,a="local-floor",c=1,l=null,h=null,u=null,d=null,f=null,m=null,g=new fh,p=t.getContextAttributes(),A=null,I=null,C=[],E=[],w=new ve,v=null,T=new Mt;T.viewport=new je;let F=new Mt;F.viewport=new je;let M=[T,F],x=new wa,R=null,G=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(W){let ie=C[W];return ie===void 0&&(ie=new Mo,C[W]=ie),ie.getTargetRaySpace()},this.getControllerGrip=function(W){let ie=C[W];return ie===void 0&&(ie=new Mo,C[W]=ie),ie.getGripSpace()},this.getHand=function(W){let ie=C[W];return ie===void 0&&(ie=new Mo,C[W]=ie),ie.getHandSpace()};function N(W){let ie=E.indexOf(W.inputSource);if(ie===-1)return;let _e=C[ie];_e!==void 0&&(_e.update(W.inputSource,W.frame,l||o),_e.dispatchEvent({type:W.type,data:W.inputSource}))}function H(){s.removeEventListener("select",N),s.removeEventListener("selectstart",N),s.removeEventListener("selectend",N),s.removeEventListener("squeeze",N),s.removeEventListener("squeezestart",N),s.removeEventListener("squeezeend",N),s.removeEventListener("end",H),s.removeEventListener("inputsourceschange",Y);for(let W=0;W<C.length;W++){let ie=E[W];ie!==null&&(E[W]=null,C[W].disconnect(ie))}R=null,G=null,g.reset(),e.setRenderTarget(A),f=null,d=null,u=null,s=null,I=null,Ve.stop(),n.isPresenting=!1,e.setPixelRatio(v),e.setSize(w.width,w.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(W){r=W,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(W){a=W,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(W){l=W},this.getBaseLayer=function(){return d!==null?d:f},this.getBinding=function(){return u},this.getFrame=function(){return m},this.getSession=function(){return s},this.setSession=async function(W){if(s=W,s!==null){if(A=e.getRenderTarget(),s.addEventListener("select",N),s.addEventListener("selectstart",N),s.addEventListener("selectend",N),s.addEventListener("squeeze",N),s.addEventListener("squeezestart",N),s.addEventListener("squeezeend",N),s.addEventListener("end",H),s.addEventListener("inputsourceschange",Y),p.xrCompatible!==!0&&await t.makeXRCompatible(),v=e.getPixelRatio(),e.getSize(w),s.enabledFeatures!==void 0&&s.enabledFeatures.includes("layers")){let _e=null,ae=null,Te=null;p.depth&&(Te=p.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,_e=p.stencil?es:Zi,ae=p.stencil?As:Oi);let Re={colorFormat:t.RGBA8,depthFormat:Te,scaleFactor:r};u=new XRWebGLBinding(s,t),d=u.createProjectionLayer(Re),s.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),I=new Hn(d.textureWidth,d.textureHeight,{format:Tt,type:vt,depthTexture:new oo(d.textureWidth,d.textureHeight,ae,void 0,void 0,void 0,void 0,void 0,void 0,_e),stencilBuffer:p.stencil,colorSpace:e.outputColorSpace,samples:p.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1})}else{let _e={antialias:p.antialias,alpha:!0,depth:p.depth,stencil:p.stencil,framebufferScaleFactor:r};f=new XRWebGLLayer(s,t,_e),s.updateRenderState({baseLayer:f}),e.setPixelRatio(1),e.setSize(f.framebufferWidth,f.framebufferHeight,!1),I=new Hn(f.framebufferWidth,f.framebufferHeight,{format:Tt,type:vt,colorSpace:e.outputColorSpace,stencilBuffer:p.stencil})}I.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await s.requestReferenceSpace(a),Ve.setContext(s),Ve.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return g.getDepthTexture()};function Y(W){for(let ie=0;ie<W.removed.length;ie++){let _e=W.removed[ie],ae=E.indexOf(_e);ae>=0&&(E[ae]=null,C[ae].disconnect(_e))}for(let ie=0;ie<W.added.length;ie++){let _e=W.added[ie],ae=E.indexOf(_e);if(ae===-1){for(let Re=0;Re<C.length;Re++)if(Re>=E.length){E.push(_e),ae=Re;break}else if(E[Re]===null){E[Re]=_e,ae=Re;break}if(ae===-1)break}let Te=C[ae];Te&&Te.connect(_e)}}let z=new b,J=new b;function k(W,ie,_e){z.setFromMatrixPosition(ie.matrixWorld),J.setFromMatrixPosition(_e.matrixWorld);let ae=z.distanceTo(J),Te=ie.projectionMatrix.elements,Re=_e.projectionMatrix.elements,ke=Te[14]/(Te[10]-1),At=Te[14]/(Te[10]+1),qe=(Te[9]+1)/Te[5],Et=(Te[9]-1)/Te[5],B=(Te[8]-1)/Te[0],gn=(Re[8]+1)/Re[0],ze=ke*B,We=ke*gn,Ce=ae/(-B+gn),ht=Ce*-B;if(ie.matrixWorld.decompose(W.position,W.quaternion,W.scale),W.translateX(ht),W.translateZ(Ce),W.matrixWorld.compose(W.position,W.quaternion,W.scale),W.matrixWorldInverse.copy(W.matrixWorld).invert(),Te[10]===-1)W.projectionMatrix.copy(ie.projectionMatrix),W.projectionMatrixInverse.copy(ie.projectionMatrixInverse);else{let xe=ke+Ce,S=At+Ce,_=ze-ht,U=We+(ae-ht),X=qe*At/S*xe,Z=Et*At/S*xe;W.projectionMatrix.makePerspective(_,U,X,Z,xe,S),W.projectionMatrixInverse.copy(W.projectionMatrix).invert()}}function te(W,ie){ie===null?W.matrixWorld.copy(W.matrix):W.matrixWorld.multiplyMatrices(ie.matrixWorld,W.matrix),W.matrixWorldInverse.copy(W.matrixWorld).invert()}this.updateCamera=function(W){if(s===null)return;let ie=W.near,_e=W.far;g.texture!==null&&(g.depthNear>0&&(ie=g.depthNear),g.depthFar>0&&(_e=g.depthFar)),x.near=F.near=T.near=ie,x.far=F.far=T.far=_e,(R!==x.near||G!==x.far)&&(s.updateRenderState({depthNear:x.near,depthFar:x.far}),R=x.near,G=x.far),T.layers.mask=W.layers.mask|2,F.layers.mask=W.layers.mask|4,x.layers.mask=T.layers.mask|F.layers.mask;let ae=W.parent,Te=x.cameras;te(x,ae);for(let Re=0;Re<Te.length;Re++)te(Te[Re],ae);Te.length===2?k(x,T,F):x.projectionMatrix.copy(T.projectionMatrix),le(W,x,ae)};function le(W,ie,_e){_e===null?W.matrix.copy(ie.matrixWorld):(W.matrix.copy(_e.matrixWorld),W.matrix.invert(),W.matrix.multiply(ie.matrixWorld)),W.matrix.decompose(W.position,W.quaternion,W.scale),W.updateMatrixWorld(!0),W.projectionMatrix.copy(ie.projectionMatrix),W.projectionMatrixInverse.copy(ie.projectionMatrixInverse),W.isPerspectiveCamera&&(W.fov=is*2*Math.atan(1/W.projectionMatrix.elements[5]),W.zoom=1)}this.getCamera=function(){return x},this.getFoveation=function(){if(!(d===null&&f===null))return c},this.setFoveation=function(W){c=W,d!==null&&(d.fixedFoveation=W),f!==null&&f.fixedFoveation!==void 0&&(f.fixedFoveation=W)},this.hasDepthSensing=function(){return g.texture!==null},this.getDepthSensingMesh=function(){return g.getMesh(x)};let ge=null;function Be(W,ie){if(h=ie.getViewerPose(l||o),m=ie,h!==null){let _e=h.views;f!==null&&(e.setRenderTargetFramebuffer(I,f.framebuffer),e.setRenderTarget(I));let ae=!1;_e.length!==x.cameras.length&&(x.cameras.length=0,ae=!0);for(let Re=0;Re<_e.length;Re++){let ke=_e[Re],At=null;if(f!==null)At=f.getViewport(ke);else{let Et=u.getViewSubImage(d,ke);At=Et.viewport,Re===0&&(e.setRenderTargetTextures(I,Et.colorTexture,d.ignoreDepthValues?void 0:Et.depthStencilTexture),e.setRenderTarget(I))}let qe=M[Re];qe===void 0&&(qe=new Mt,qe.layers.enable(Re),qe.viewport=new je,M[Re]=qe),qe.matrix.fromArray(ke.transform.matrix),qe.matrix.decompose(qe.position,qe.quaternion,qe.scale),qe.projectionMatrix.fromArray(ke.projectionMatrix),qe.projectionMatrixInverse.copy(qe.projectionMatrix).invert(),qe.viewport.set(At.x,At.y,At.width,At.height),Re===0&&(x.matrix.copy(qe.matrix),x.matrix.decompose(x.position,x.quaternion,x.scale)),ae===!0&&x.cameras.push(qe)}let Te=s.enabledFeatures;if(Te&&Te.includes("depth-sensing")){let Re=u.getDepthInformation(_e[0]);Re&&Re.isValid&&Re.texture&&g.init(e,Re,s.renderState)}}for(let _e=0;_e<C.length;_e++){let ae=E[_e],Te=C[_e];ae!==null&&Te!==void 0&&Te.update(ae,ie,l||o)}ge&&ge(W,ie),ie.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:ie}),m=null}let Ve=new qf;Ve.setAnimationLoop(Be),this.setAnimationLoop=function(W){ge=W},this.dispose=function(){}}},Ms=new Un,hy=new Pe;function uy(i,e){function t(p,A){p.matrixAutoUpdate===!0&&p.updateMatrix(),A.value.copy(p.matrix)}function n(p,A){A.color.getRGB(p.fogColor.value,Zl(i)),A.isFog?(p.fogNear.value=A.near,p.fogFar.value=A.far):A.isFogExp2&&(p.fogDensity.value=A.density)}function s(p,A,I,C,E){A.isMeshBasicMaterial||A.isMeshLambertMaterial?r(p,A):A.isMeshToonMaterial?(r(p,A),u(p,A)):A.isMeshPhongMaterial?(r(p,A),h(p,A)):A.isMeshStandardMaterial?(r(p,A),d(p,A),A.isMeshPhysicalMaterial&&f(p,A,E)):A.isMeshMatcapMaterial?(r(p,A),m(p,A)):A.isMeshDepthMaterial?r(p,A):A.isMeshDistanceMaterial?(r(p,A),g(p,A)):A.isMeshNormalMaterial?r(p,A):A.isLineBasicMaterial?(o(p,A),A.isLineDashedMaterial&&a(p,A)):A.isPointsMaterial?c(p,A,I,C):A.isSpriteMaterial?l(p,A):A.isShadowMaterial?(p.color.value.copy(A.color),p.opacity.value=A.opacity):A.isShaderMaterial&&(A.uniformsNeedUpdate=!1)}function r(p,A){p.opacity.value=A.opacity,A.color&&p.diffuse.value.copy(A.color),A.emissive&&p.emissive.value.copy(A.emissive).multiplyScalar(A.emissiveIntensity),A.map&&(p.map.value=A.map,t(A.map,p.mapTransform)),A.alphaMap&&(p.alphaMap.value=A.alphaMap,t(A.alphaMap,p.alphaMapTransform)),A.bumpMap&&(p.bumpMap.value=A.bumpMap,t(A.bumpMap,p.bumpMapTransform),p.bumpScale.value=A.bumpScale,A.side===Ut&&(p.bumpScale.value*=-1)),A.normalMap&&(p.normalMap.value=A.normalMap,t(A.normalMap,p.normalMapTransform),p.normalScale.value.copy(A.normalScale),A.side===Ut&&p.normalScale.value.negate()),A.displacementMap&&(p.displacementMap.value=A.displacementMap,t(A.displacementMap,p.displacementMapTransform),p.displacementScale.value=A.displacementScale,p.displacementBias.value=A.displacementBias),A.emissiveMap&&(p.emissiveMap.value=A.emissiveMap,t(A.emissiveMap,p.emissiveMapTransform)),A.specularMap&&(p.specularMap.value=A.specularMap,t(A.specularMap,p.specularMapTransform)),A.alphaTest>0&&(p.alphaTest.value=A.alphaTest);let I=e.get(A),C=I.envMap,E=I.envMapRotation;C&&(p.envMap.value=C,Ms.copy(E),Ms.x*=-1,Ms.y*=-1,Ms.z*=-1,C.isCubeTexture&&C.isRenderTargetTexture===!1&&(Ms.y*=-1,Ms.z*=-1),p.envMapRotation.value.setFromMatrix4(hy.makeRotationFromEuler(Ms)),p.flipEnvMap.value=C.isCubeTexture&&C.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=A.reflectivity,p.ior.value=A.ior,p.refractionRatio.value=A.refractionRatio),A.lightMap&&(p.lightMap.value=A.lightMap,p.lightMapIntensity.value=A.lightMapIntensity,t(A.lightMap,p.lightMapTransform)),A.aoMap&&(p.aoMap.value=A.aoMap,p.aoMapIntensity.value=A.aoMapIntensity,t(A.aoMap,p.aoMapTransform))}function o(p,A){p.diffuse.value.copy(A.color),p.opacity.value=A.opacity,A.map&&(p.map.value=A.map,t(A.map,p.mapTransform))}function a(p,A){p.dashSize.value=A.dashSize,p.totalSize.value=A.dashSize+A.gapSize,p.scale.value=A.scale}function c(p,A,I,C){p.diffuse.value.copy(A.color),p.opacity.value=A.opacity,p.size.value=A.size*I,p.scale.value=C*.5,A.map&&(p.map.value=A.map,t(A.map,p.uvTransform)),A.alphaMap&&(p.alphaMap.value=A.alphaMap,t(A.alphaMap,p.alphaMapTransform)),A.alphaTest>0&&(p.alphaTest.value=A.alphaTest)}function l(p,A){p.diffuse.value.copy(A.color),p.opacity.value=A.opacity,p.rotation.value=A.rotation,A.map&&(p.map.value=A.map,t(A.map,p.mapTransform)),A.alphaMap&&(p.alphaMap.value=A.alphaMap,t(A.alphaMap,p.alphaMapTransform)),A.alphaTest>0&&(p.alphaTest.value=A.alphaTest)}function h(p,A){p.specular.value.copy(A.specular),p.shininess.value=Math.max(A.shininess,1e-4)}function u(p,A){A.gradientMap&&(p.gradientMap.value=A.gradientMap)}function d(p,A){p.metalness.value=A.metalness,A.metalnessMap&&(p.metalnessMap.value=A.metalnessMap,t(A.metalnessMap,p.metalnessMapTransform)),p.roughness.value=A.roughness,A.roughnessMap&&(p.roughnessMap.value=A.roughnessMap,t(A.roughnessMap,p.roughnessMapTransform)),A.envMap&&(p.envMapIntensity.value=A.envMapIntensity)}function f(p,A,I){p.ior.value=A.ior,A.sheen>0&&(p.sheenColor.value.copy(A.sheenColor).multiplyScalar(A.sheen),p.sheenRoughness.value=A.sheenRoughness,A.sheenColorMap&&(p.sheenColorMap.value=A.sheenColorMap,t(A.sheenColorMap,p.sheenColorMapTransform)),A.sheenRoughnessMap&&(p.sheenRoughnessMap.value=A.sheenRoughnessMap,t(A.sheenRoughnessMap,p.sheenRoughnessMapTransform))),A.clearcoat>0&&(p.clearcoat.value=A.clearcoat,p.clearcoatRoughness.value=A.clearcoatRoughness,A.clearcoatMap&&(p.clearcoatMap.value=A.clearcoatMap,t(A.clearcoatMap,p.clearcoatMapTransform)),A.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=A.clearcoatRoughnessMap,t(A.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),A.clearcoatNormalMap&&(p.clearcoatNormalMap.value=A.clearcoatNormalMap,t(A.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(A.clearcoatNormalScale),A.side===Ut&&p.clearcoatNormalScale.value.negate())),A.dispersion>0&&(p.dispersion.value=A.dispersion),A.iridescence>0&&(p.iridescence.value=A.iridescence,p.iridescenceIOR.value=A.iridescenceIOR,p.iridescenceThicknessMinimum.value=A.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=A.iridescenceThicknessRange[1],A.iridescenceMap&&(p.iridescenceMap.value=A.iridescenceMap,t(A.iridescenceMap,p.iridescenceMapTransform)),A.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=A.iridescenceThicknessMap,t(A.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),A.transmission>0&&(p.transmission.value=A.transmission,p.transmissionSamplerMap.value=I.texture,p.transmissionSamplerSize.value.set(I.width,I.height),A.transmissionMap&&(p.transmissionMap.value=A.transmissionMap,t(A.transmissionMap,p.transmissionMapTransform)),p.thickness.value=A.thickness,A.thicknessMap&&(p.thicknessMap.value=A.thicknessMap,t(A.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=A.attenuationDistance,p.attenuationColor.value.copy(A.attenuationColor)),A.anisotropy>0&&(p.anisotropyVector.value.set(A.anisotropy*Math.cos(A.anisotropyRotation),A.anisotropy*Math.sin(A.anisotropyRotation)),A.anisotropyMap&&(p.anisotropyMap.value=A.anisotropyMap,t(A.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=A.specularIntensity,p.specularColor.value.copy(A.specularColor),A.specularColorMap&&(p.specularColorMap.value=A.specularColorMap,t(A.specularColorMap,p.specularColorMapTransform)),A.specularIntensityMap&&(p.specularIntensityMap.value=A.specularIntensityMap,t(A.specularIntensityMap,p.specularIntensityMapTransform))}function m(p,A){A.matcap&&(p.matcap.value=A.matcap)}function g(p,A){let I=e.get(A).light;p.referencePosition.value.setFromMatrixPosition(I.matrixWorld),p.nearDistance.value=I.shadow.camera.near,p.farDistance.value=I.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function dy(i,e,t,n){let s={},r={},o=[],a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function c(I,C){let E=C.program;n.uniformBlockBinding(I,E)}function l(I,C){let E=s[I.id];E===void 0&&(m(I),E=h(I),s[I.id]=E,I.addEventListener("dispose",p));let w=C.program;n.updateUBOMapping(I,w);let v=e.render.frame;r[I.id]!==v&&(d(I),r[I.id]=v)}function h(I){let C=u();I.__bindingPointIndex=C;let E=i.createBuffer(),w=I.__size,v=I.usage;return i.bindBuffer(i.UNIFORM_BUFFER,E),i.bufferData(i.UNIFORM_BUFFER,w,v),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,C,E),E}function u(){for(let I=0;I<a;I++)if(o.indexOf(I)===-1)return o.push(I),I;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function d(I){let C=s[I.id],E=I.uniforms,w=I.__cache;i.bindBuffer(i.UNIFORM_BUFFER,C);for(let v=0,T=E.length;v<T;v++){let F=Array.isArray(E[v])?E[v]:[E[v]];for(let M=0,x=F.length;M<x;M++){let R=F[M];if(f(R,v,M,w)===!0){let G=R.__offset,N=Array.isArray(R.value)?R.value:[R.value],H=0;for(let Y=0;Y<N.length;Y++){let z=N[Y],J=g(z);typeof z=="number"||typeof z=="boolean"?(R.__data[0]=z,i.bufferSubData(i.UNIFORM_BUFFER,G+H,R.__data)):z.isMatrix3?(R.__data[0]=z.elements[0],R.__data[1]=z.elements[1],R.__data[2]=z.elements[2],R.__data[3]=0,R.__data[4]=z.elements[3],R.__data[5]=z.elements[4],R.__data[6]=z.elements[5],R.__data[7]=0,R.__data[8]=z.elements[6],R.__data[9]=z.elements[7],R.__data[10]=z.elements[8],R.__data[11]=0):(z.toArray(R.__data,H),H+=J.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,G,R.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function f(I,C,E,w){let v=I.value,T=C+"_"+E;if(w[T]===void 0)return typeof v=="number"||typeof v=="boolean"?w[T]=v:w[T]=v.clone(),!0;{let F=w[T];if(typeof v=="number"||typeof v=="boolean"){if(F!==v)return w[T]=v,!0}else if(F.equals(v)===!1)return F.copy(v),!0}return!1}function m(I){let C=I.uniforms,E=0,w=16;for(let T=0,F=C.length;T<F;T++){let M=Array.isArray(C[T])?C[T]:[C[T]];for(let x=0,R=M.length;x<R;x++){let G=M[x],N=Array.isArray(G.value)?G.value:[G.value];for(let H=0,Y=N.length;H<Y;H++){let z=N[H],J=g(z),k=E%w,te=k%J.boundary,le=k+te;E+=te,le!==0&&w-le<J.storage&&(E+=w-le),G.__data=new Float32Array(J.storage/Float32Array.BYTES_PER_ELEMENT),G.__offset=E,E+=J.storage}}}let v=E%w;return v>0&&(E+=w-v),I.__size=E,I.__cache={},this}function g(I){let C={boundary:0,storage:0};return typeof I=="number"||typeof I=="boolean"?(C.boundary=4,C.storage=4):I.isVector2?(C.boundary=8,C.storage=8):I.isVector3||I.isColor?(C.boundary=16,C.storage=12):I.isVector4?(C.boundary=16,C.storage=16):I.isMatrix3?(C.boundary=48,C.storage=48):I.isMatrix4?(C.boundary=64,C.storage=64):I.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",I),C}function p(I){let C=I.target;C.removeEventListener("dispose",p);let E=o.indexOf(C.__bindingPointIndex);o.splice(E,1),i.deleteBuffer(s[C.id]),delete s[C.id],delete r[C.id]}function A(){for(let I in s)i.deleteBuffer(s[I]);o=[],s={},r={}}return{bind:c,update:l,dispose:A}}var fc=class{constructor(e={}){let{canvas:t=gf(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1,reverseDepthBuffer:d=!1}=e;this.isWebGLRenderer=!0;let f;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");f=n.getContextAttributes().alpha}else f=o;let m=new Uint32Array(4),g=new Int32Array(4),p=null,A=null,I=[],C=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=et,this.toneMapping=Ai,this.toneMappingExposure=1;let E=this,w=!1,v=0,T=0,F=null,M=-1,x=null,R=new je,G=new je,N=null,H=new Ee(0),Y=0,z=t.width,J=t.height,k=1,te=null,le=null,ge=new je(0,0,z,J),Be=new je(0,0,z,J),Ve=!1,W=new sr,ie=!1,_e=!1;this.transmissionResolutionScale=1;let ae=new Pe,Te=new Pe,Re=new b,ke=new je,At={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},qe=!1;function Et(){return F===null?k:1}let B=n;function gn(y,L){return t.getContext(y,L)}try{let y={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${"172"}`),t.addEventListener("webglcontextlost",q,!1),t.addEventListener("webglcontextrestored",ue,!1),t.addEventListener("webglcontextcreationerror",he,!1),B===null){let L="webgl2";if(B=gn(L,y),B===null)throw gn(L)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}}catch(y){throw console.error("THREE.WebGLRenderer: "+y.message),y}let ze,We,Ce,ht,xe,S,_,U,X,Z,K,ye,ce,fe,Ye,ee,Ae,Se,we,pe,Ke,Ue,lt,D;function re(){ze=new b0(B),ze.init(),Ue=new oy(B,ze),We=new M0(B,ze,e,Ue),Ce=new sy(B,ze),We.reverseDepthBuffer&&d&&Ce.buffers.depth.setReversed(!0),ht=new D0(B),xe=new WE,S=new ry(B,ze,Ce,xe,We,Ue,ht),_=new S0(E),U=new w0(E),X=new Qm(B),lt=new x0(B,X),Z=new B0(B,X,ht,lt),K=new P0(B,Z,X,ht),we=new L0(B,We,S),ee=new I0(xe),ye=new zE(E,_,U,ze,We,lt,ee),ce=new uy(E,xe),fe=new XE,Ye=new $E(ze),Se=new y0(E,_,U,Ce,K,f,c),Ae=new ny(E,K,We),D=new dy(B,ht,We,Ce),pe=new C0(B,ze,ht),Ke=new R0(B,ze,ht),ht.programs=ye.programs,E.capabilities=We,E.extensions=ze,E.properties=xe,E.renderLists=fe,E.shadowMap=Ae,E.state=Ce,E.info=ht}re();let V=new Ah(E,B);this.xr=V,this.getContext=function(){return B},this.getContextAttributes=function(){return B.getContextAttributes()},this.forceContextLoss=function(){let y=ze.get("WEBGL_lose_context");y&&y.loseContext()},this.forceContextRestore=function(){let y=ze.get("WEBGL_lose_context");y&&y.restoreContext()},this.getPixelRatio=function(){return k},this.setPixelRatio=function(y){y!==void 0&&(k=y,this.setSize(z,J,!1))},this.getSize=function(y){return y.set(z,J)},this.setSize=function(y,L,O=!0){if(V.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}z=y,J=L,t.width=Math.floor(y*k),t.height=Math.floor(L*k),O===!0&&(t.style.width=y+"px",t.style.height=L+"px"),this.setViewport(0,0,y,L)},this.getDrawingBufferSize=function(y){return y.set(z*k,J*k).floor()},this.setDrawingBufferSize=function(y,L,O){z=y,J=L,k=O,t.width=Math.floor(y*O),t.height=Math.floor(L*O),this.setViewport(0,0,y,L)},this.getCurrentViewport=function(y){return y.copy(R)},this.getViewport=function(y){return y.copy(ge)},this.setViewport=function(y,L,O,Q){y.isVector4?ge.set(y.x,y.y,y.z,y.w):ge.set(y,L,O,Q),Ce.viewport(R.copy(ge).multiplyScalar(k).round())},this.getScissor=function(y){return y.copy(Be)},this.setScissor=function(y,L,O,Q){y.isVector4?Be.set(y.x,y.y,y.z,y.w):Be.set(y,L,O,Q),Ce.scissor(G.copy(Be).multiplyScalar(k).round())},this.getScissorTest=function(){return Ve},this.setScissorTest=function(y){Ce.setScissorTest(Ve=y)},this.setOpaqueSort=function(y){te=y},this.setTransparentSort=function(y){le=y},this.getClearColor=function(y){return y.copy(Se.getClearColor())},this.setClearColor=function(){Se.setClearColor.apply(Se,arguments)},this.getClearAlpha=function(){return Se.getClearAlpha()},this.setClearAlpha=function(){Se.setClearAlpha.apply(Se,arguments)},this.clear=function(y=!0,L=!0,O=!0){let Q=0;if(y){let P=!1;if(F!==null){let $=F.texture.format;P=$===Wa||$===za||$===Va}if(P){let $=F.texture.type,oe=$===vt||$===Oi||$===lr||$===As||$===Ga||$===Ha,de=Se.getClearColor(),me=Se.getClearAlpha(),be=de.r,De=de.g,Me=de.b;oe?(m[0]=be,m[1]=De,m[2]=Me,m[3]=me,B.clearBufferuiv(B.COLOR,0,m)):(g[0]=be,g[1]=De,g[2]=Me,g[3]=me,B.clearBufferiv(B.COLOR,0,g))}else Q|=B.COLOR_BUFFER_BIT}L&&(Q|=B.DEPTH_BUFFER_BIT),O&&(Q|=B.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),B.clear(Q)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",q,!1),t.removeEventListener("webglcontextrestored",ue,!1),t.removeEventListener("webglcontextcreationerror",he,!1),Se.dispose(),fe.dispose(),Ye.dispose(),xe.dispose(),_.dispose(),U.dispose(),K.dispose(),lt.dispose(),D.dispose(),ye.dispose(),V.dispose(),V.removeEventListener("sessionstart",Gu),V.removeEventListener("sessionend",Hu),zi.stop()};function q(y){y.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),w=!0}function ue(){console.log("THREE.WebGLRenderer: Context Restored."),w=!1;let y=ht.autoReset,L=Ae.enabled,O=Ae.autoUpdate,Q=Ae.needsUpdate,P=Ae.type;re(),ht.autoReset=y,Ae.enabled=L,Ae.autoUpdate=O,Ae.needsUpdate=Q,Ae.type=P}function he(y){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",y.statusMessage)}function Fe(y){let L=y.target;L.removeEventListener("dispose",Fe),gt(L)}function gt(y){Ot(y),xe.remove(y)}function Ot(y){let L=xe.get(y).programs;L!==void 0&&(L.forEach(function(O){ye.releaseProgram(O)}),y.isShaderMaterial&&ye.releaseShaderCache(y))}this.renderBufferDirect=function(y,L,O,Q,P,$){L===null&&(L=At);let oe=P.isMesh&&P.matrixWorld.determinant()<0,de=Up(y,L,O,Q,P);Ce.setMaterial(Q,oe);let me=O.index,be=1;if(Q.wireframe===!0){if(me=Z.getWireframeAttribute(O),me===void 0)return;be=2}let De=O.drawRange,Me=O.attributes.position,Je=De.start*be,tt=(De.start+De.count)*be;$!==null&&(Je=Math.max(Je,$.start*be),tt=Math.min(tt,($.start+$.count)*be)),me!==null?(Je=Math.max(Je,0),tt=Math.min(tt,me.count)):Me!=null&&(Je=Math.max(Je,0),tt=Math.min(tt,Me.count));let xt=tt-Je;if(xt<0||xt===1/0)return;lt.setup(P,Q,de,O,me);let _t,Ze=pe;if(me!==null&&(_t=X.get(me),Ze=Ke,Ze.setIndex(_t)),P.isMesh)Q.wireframe===!0?(Ce.setLineWidth(Q.wireframeLinewidth*Et()),Ze.setMode(B.LINES)):Ze.setMode(B.TRIANGLES);else if(P.isLine){let Ie=Q.linewidth;Ie===void 0&&(Ie=1),Ce.setLineWidth(Ie*Et()),P.isLineSegments?Ze.setMode(B.LINES):P.isLineLoop?Ze.setMode(B.LINE_LOOP):Ze.setMode(B.LINE_STRIP)}else P.isPoints?Ze.setMode(B.POINTS):P.isSprite&&Ze.setMode(B.TRIANGLES);if(P.isBatchedMesh)if(P._multiDrawInstances!==null)Ze.renderMultiDrawInstances(P._multiDrawStarts,P._multiDrawCounts,P._multiDrawCount,P._multiDrawInstances);else if(ze.get("WEBGL_multi_draw"))Ze.renderMultiDraw(P._multiDrawStarts,P._multiDrawCounts,P._multiDrawCount);else{let Ie=P._multiDrawStarts,Lt=P._multiDrawCounts,nt=P._multiDrawCount,wn=me?X.get(me).bytesPerElement:1,Us=xe.get(Q).currentProgram.getUniforms();for(let hn=0;hn<nt;hn++)Us.setValue(B,"_gl_DrawID",hn),Ze.render(Ie[hn]/wn,Lt[hn])}else if(P.isInstancedMesh)Ze.renderInstances(Je,xt,P.count);else if(O.isInstancedBufferGeometry){let Ie=O._maxInstanceCount!==void 0?O._maxInstanceCount:1/0,Lt=Math.min(O.instanceCount,Ie);Ze.renderInstances(Je,xt,Lt)}else Ze.render(Je,xt)};function st(y,L,O){y.transparent===!0&&y.side===Mn&&y.forceSinglePass===!1?(y.side=Ut,y.needsUpdate=!0,Qo(y,L,O),y.side=Fn,y.needsUpdate=!0,Qo(y,L,O),y.side=Mn):Qo(y,L,O)}this.compile=function(y,L,O=null){O===null&&(O=y),A=Ye.get(O),A.init(L),C.push(A),O.traverseVisible(function(P){P.isLight&&P.layers.test(L.layers)&&(A.pushLight(P),P.castShadow&&A.pushShadow(P))}),y!==O&&y.traverseVisible(function(P){P.isLight&&P.layers.test(L.layers)&&(A.pushLight(P),P.castShadow&&A.pushShadow(P))}),A.setupLights();let Q=new Set;return y.traverse(function(P){if(!(P.isMesh||P.isPoints||P.isLine||P.isSprite))return;let $=P.material;if($)if(Array.isArray($))for(let oe=0;oe<$.length;oe++){let de=$[oe];st(de,O,P),Q.add(de)}else st($,O,P),Q.add($)}),C.pop(),A=null,Q},this.compileAsync=function(y,L,O=null){let Q=this.compile(y,L,O);return new Promise(P=>{function $(){if(Q.forEach(function(oe){xe.get(oe).currentProgram.isReady()&&Q.delete(oe)}),Q.size===0){P(y);return}setTimeout($,10)}ze.get("KHR_parallel_shader_compile")!==null?$():setTimeout($,10)})};let Tn=null;function $n(y){Tn&&Tn(y)}function Gu(){zi.stop()}function Hu(){zi.start()}let zi=new qf;zi.setAnimationLoop($n),typeof self<"u"&&zi.setContext(self),this.setAnimationLoop=function(y){Tn=y,V.setAnimationLoop(y),y===null?zi.stop():zi.start()},V.addEventListener("sessionstart",Gu),V.addEventListener("sessionend",Hu),this.render=function(y,L){if(L!==void 0&&L.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(w===!0)return;if(y.matrixWorldAutoUpdate===!0&&y.updateMatrixWorld(),L.parent===null&&L.matrixWorldAutoUpdate===!0&&L.updateMatrixWorld(),V.enabled===!0&&V.isPresenting===!0&&(V.cameraAutoUpdate===!0&&V.updateCamera(L),L=V.getCamera()),y.isScene===!0&&y.onBeforeRender(E,y,L,F),A=Ye.get(y,C.length),A.init(L),C.push(A),Te.multiplyMatrices(L.projectionMatrix,L.matrixWorldInverse),W.setFromProjectionMatrix(Te),_e=this.localClippingEnabled,ie=ee.init(this.clippingPlanes,_e),p=fe.get(y,I.length),p.init(),I.push(p),V.enabled===!0&&V.isPresenting===!0){let $=E.xr.getDepthSensingMesh();$!==null&&Kc($,L,-1/0,E.sortObjects)}Kc(y,L,0,E.sortObjects),p.finish(),E.sortObjects===!0&&p.sort(te,le),qe=V.enabled===!1||V.isPresenting===!1||V.hasDepthSensing()===!1,qe&&Se.addToRenderList(p,y),this.info.render.frame++,ie===!0&&ee.beginShadows();let O=A.state.shadowsArray;Ae.render(O,y,L),ie===!0&&ee.endShadows(),this.info.autoReset===!0&&this.info.reset();let Q=p.opaque,P=p.transmissive;if(A.setupLights(),L.isArrayCamera){let $=L.cameras;if(P.length>0)for(let oe=0,de=$.length;oe<de;oe++){let me=$[oe];zu(Q,P,y,me)}qe&&Se.render(y);for(let oe=0,de=$.length;oe<de;oe++){let me=$[oe];Vu(p,y,me,me.viewport)}}else P.length>0&&zu(Q,P,y,L),qe&&Se.render(y),Vu(p,y,L);F!==null&&T===0&&(S.updateMultisampleRenderTarget(F),S.updateRenderTargetMipmap(F)),y.isScene===!0&&y.onAfterRender(E,y,L),lt.resetDefaultState(),M=-1,x=null,C.pop(),C.length>0?(A=C[C.length-1],ie===!0&&ee.setGlobalState(E.clippingPlanes,A.state.camera)):A=null,I.pop(),I.length>0?p=I[I.length-1]:p=null};function Kc(y,L,O,Q){if(y.visible===!1)return;if(y.layers.test(L.layers)){if(y.isGroup)O=y.renderOrder;else if(y.isLOD)y.autoUpdate===!0&&y.update(L);else if(y.isLight)A.pushLight(y),y.castShadow&&A.pushShadow(y);else if(y.isSprite){if(!y.frustumCulled||W.intersectsSprite(y)){Q&&ke.setFromMatrixPosition(y.matrixWorld).applyMatrix4(Te);let oe=K.update(y),de=y.material;de.visible&&p.push(y,oe,de,O,ke.z,null)}}else if((y.isMesh||y.isLine||y.isPoints)&&(!y.frustumCulled||W.intersectsObject(y))){let oe=K.update(y),de=y.material;if(Q&&(y.boundingSphere!==void 0?(y.boundingSphere===null&&y.computeBoundingSphere(),ke.copy(y.boundingSphere.center)):(oe.boundingSphere===null&&oe.computeBoundingSphere(),ke.copy(oe.boundingSphere.center)),ke.applyMatrix4(y.matrixWorld).applyMatrix4(Te)),Array.isArray(de)){let me=oe.groups;for(let be=0,De=me.length;be<De;be++){let Me=me[be],Je=de[Me.materialIndex];Je&&Je.visible&&p.push(y,oe,Je,O,ke.z,Me)}}else de.visible&&p.push(y,oe,de,O,ke.z,null)}}let $=y.children;for(let oe=0,de=$.length;oe<de;oe++)Kc($[oe],L,O,Q)}function Vu(y,L,O,Q){let P=y.opaque,$=y.transmissive,oe=y.transparent;A.setupLightsView(O),ie===!0&&ee.setGlobalState(E.clippingPlanes,O),Q&&Ce.viewport(R.copy(Q)),P.length>0&&Oo(P,L,O),$.length>0&&Oo($,L,O),oe.length>0&&Oo(oe,L,O),Ce.buffers.depth.setTest(!0),Ce.buffers.depth.setMask(!0),Ce.buffers.color.setMask(!0),Ce.setPolygonOffset(!1)}function zu(y,L,O,Q){if((O.isScene===!0?O.overrideMaterial:null)!==null)return;A.state.transmissionRenderTarget[Q.id]===void 0&&(A.state.transmissionRenderTarget[Q.id]=new Hn(1,1,{generateMipmaps:!0,type:ze.has("EXT_color_buffer_half_float")||ze.has("EXT_color_buffer_float")?mn:vt,minFilter:an,samples:4,stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,colorSpace:Qe.workingColorSpace}));let $=A.state.transmissionRenderTarget[Q.id],oe=Q.viewport||R;$.setSize(oe.z*E.transmissionResolutionScale,oe.w*E.transmissionResolutionScale);let de=E.getRenderTarget();E.setRenderTarget($),E.getClearColor(H),Y=E.getClearAlpha(),Y<1&&E.setClearColor(16777215,.5),E.clear(),qe&&Se.render(O);let me=E.toneMapping;E.toneMapping=Ai;let be=Q.viewport;if(Q.viewport!==void 0&&(Q.viewport=void 0),A.setupLightsView(Q),ie===!0&&ee.setGlobalState(E.clippingPlanes,Q),Oo(y,O,Q),S.updateMultisampleRenderTarget($),S.updateRenderTargetMipmap($),ze.has("WEBGL_multisampled_render_to_texture")===!1){let De=!1;for(let Me=0,Je=L.length;Me<Je;Me++){let tt=L[Me],xt=tt.object,_t=tt.geometry,Ze=tt.material,Ie=tt.group;if(Ze.side===Mn&&xt.layers.test(Q.layers)){let Lt=Ze.side;Ze.side=Ut,Ze.needsUpdate=!0,Wu(xt,O,Q,_t,Ze,Ie),Ze.side=Lt,Ze.needsUpdate=!0,De=!0}}De===!0&&(S.updateMultisampleRenderTarget($),S.updateRenderTargetMipmap($))}E.setRenderTarget(de),E.setClearColor(H,Y),be!==void 0&&(Q.viewport=be),E.toneMapping=me}function Oo(y,L,O){let Q=L.isScene===!0?L.overrideMaterial:null;for(let P=0,$=y.length;P<$;P++){let oe=y[P],de=oe.object,me=oe.geometry,be=Q===null?oe.material:Q,De=oe.group;de.layers.test(O.layers)&&Wu(de,L,O,me,be,De)}}function Wu(y,L,O,Q,P,$){y.onBeforeRender(E,L,O,Q,P,$),y.modelViewMatrix.multiplyMatrices(O.matrixWorldInverse,y.matrixWorld),y.normalMatrix.getNormalMatrix(y.modelViewMatrix),P.onBeforeRender(E,L,O,Q,y,$),P.transparent===!0&&P.side===Mn&&P.forceSinglePass===!1?(P.side=Ut,P.needsUpdate=!0,E.renderBufferDirect(O,L,Q,P,y,$),P.side=Fn,P.needsUpdate=!0,E.renderBufferDirect(O,L,Q,P,y,$),P.side=Mn):E.renderBufferDirect(O,L,Q,P,y,$),y.onAfterRender(E,L,O,Q,P,$)}function Qo(y,L,O){L.isScene!==!0&&(L=At);let Q=xe.get(y),P=A.state.lights,$=A.state.shadowsArray,oe=P.state.version,de=ye.getParameters(y,P.state,$,L,O),me=ye.getProgramCacheKey(de),be=Q.programs;Q.environment=y.isMeshStandardMaterial?L.environment:null,Q.fog=L.fog,Q.envMap=(y.isMeshStandardMaterial?U:_).get(y.envMap||Q.environment),Q.envMapRotation=Q.environment!==null&&y.envMap===null?L.environmentRotation:y.envMapRotation,be===void 0&&(y.addEventListener("dispose",Fe),be=new Map,Q.programs=be);let De=be.get(me);if(De!==void 0){if(Q.currentProgram===De&&Q.lightsStateVersion===oe)return Xu(y,de),De}else de.uniforms=ye.getUniforms(y),y.onBeforeCompile(de,E),De=ye.acquireProgram(de,me),be.set(me,De),Q.uniforms=de.uniforms;let Me=Q.uniforms;return(!y.isShaderMaterial&&!y.isRawShaderMaterial||y.clipping===!0)&&(Me.clippingPlanes=ee.uniform),Xu(y,de),Q.needsLights=Op(y),Q.lightsStateVersion=oe,Q.needsLights&&(Me.ambientLightColor.value=P.state.ambient,Me.lightProbe.value=P.state.probe,Me.directionalLights.value=P.state.directional,Me.directionalLightShadows.value=P.state.directionalShadow,Me.spotLights.value=P.state.spot,Me.spotLightShadows.value=P.state.spotShadow,Me.rectAreaLights.value=P.state.rectArea,Me.ltc_1.value=P.state.rectAreaLTC1,Me.ltc_2.value=P.state.rectAreaLTC2,Me.pointLights.value=P.state.point,Me.pointLightShadows.value=P.state.pointShadow,Me.hemisphereLights.value=P.state.hemi,Me.directionalShadowMap.value=P.state.directionalShadowMap,Me.directionalShadowMatrix.value=P.state.directionalShadowMatrix,Me.spotShadowMap.value=P.state.spotShadowMap,Me.spotLightMatrix.value=P.state.spotLightMatrix,Me.spotLightMap.value=P.state.spotLightMap,Me.pointShadowMap.value=P.state.pointShadowMap,Me.pointShadowMatrix.value=P.state.pointShadowMatrix),Q.currentProgram=De,Q.uniformsList=null,De}function Ku(y){if(y.uniformsList===null){let L=y.currentProgram.getUniforms();y.uniformsList=Er.seqWithValue(L.seq,y.uniforms)}return y.uniformsList}function Xu(y,L){let O=xe.get(y);O.outputColorSpace=L.outputColorSpace,O.batching=L.batching,O.batchingColor=L.batchingColor,O.instancing=L.instancing,O.instancingColor=L.instancingColor,O.instancingMorph=L.instancingMorph,O.skinning=L.skinning,O.morphTargets=L.morphTargets,O.morphNormals=L.morphNormals,O.morphColors=L.morphColors,O.morphTargetsCount=L.morphTargetsCount,O.numClippingPlanes=L.numClippingPlanes,O.numIntersection=L.numClipIntersection,O.vertexAlphas=L.vertexAlphas,O.vertexTangents=L.vertexTangents,O.toneMapping=L.toneMapping}function Up(y,L,O,Q,P){L.isScene!==!0&&(L=At),S.resetTextureUnits();let $=L.fog,oe=Q.isMeshStandardMaterial?L.environment:null,de=F===null?E.outputColorSpace:F.isXRRenderTarget===!0?F.texture.colorSpace:yt,me=(Q.isMeshStandardMaterial?U:_).get(Q.envMap||oe),be=Q.vertexColors===!0&&!!O.attributes.color&&O.attributes.color.itemSize===4,De=!!O.attributes.tangent&&(!!Q.normalMap||Q.anisotropy>0),Me=!!O.morphAttributes.position,Je=!!O.morphAttributes.normal,tt=!!O.morphAttributes.color,xt=Ai;Q.toneMapped&&(F===null||F.isXRRenderTarget===!0)&&(xt=E.toneMapping);let _t=O.morphAttributes.position||O.morphAttributes.normal||O.morphAttributes.color,Ze=_t!==void 0?_t.length:0,Ie=xe.get(Q),Lt=A.state.lights;if(ie===!0&&(_e===!0||y!==x)){let Jt=y===x&&Q.id===M;ee.setState(Q,y,Jt)}let nt=!1;Q.version===Ie.__version?(Ie.needsLights&&Ie.lightsStateVersion!==Lt.state.version||Ie.outputColorSpace!==de||P.isBatchedMesh&&Ie.batching===!1||!P.isBatchedMesh&&Ie.batching===!0||P.isBatchedMesh&&Ie.batchingColor===!0&&P.colorTexture===null||P.isBatchedMesh&&Ie.batchingColor===!1&&P.colorTexture!==null||P.isInstancedMesh&&Ie.instancing===!1||!P.isInstancedMesh&&Ie.instancing===!0||P.isSkinnedMesh&&Ie.skinning===!1||!P.isSkinnedMesh&&Ie.skinning===!0||P.isInstancedMesh&&Ie.instancingColor===!0&&P.instanceColor===null||P.isInstancedMesh&&Ie.instancingColor===!1&&P.instanceColor!==null||P.isInstancedMesh&&Ie.instancingMorph===!0&&P.morphTexture===null||P.isInstancedMesh&&Ie.instancingMorph===!1&&P.morphTexture!==null||Ie.envMap!==me||Q.fog===!0&&Ie.fog!==$||Ie.numClippingPlanes!==void 0&&(Ie.numClippingPlanes!==ee.numPlanes||Ie.numIntersection!==ee.numIntersection)||Ie.vertexAlphas!==be||Ie.vertexTangents!==De||Ie.morphTargets!==Me||Ie.morphNormals!==Je||Ie.morphColors!==tt||Ie.toneMapping!==xt||Ie.morphTargetsCount!==Ze)&&(nt=!0):(nt=!0,Ie.__version=Q.version);let wn=Ie.currentProgram;nt===!0&&(wn=Qo(Q,L,P));let Us=!1,hn=!1,Lr=!1,dt=wn.getUniforms(),_n=Ie.uniforms;if(Ce.useProgram(wn.program)&&(Us=!0,hn=!0,Lr=!0),Q.id!==M&&(M=Q.id,hn=!0),Us||x!==y){Ce.buffers.depth.getReversed()?(ae.copy(y.projectionMatrix),Ef(ae),yf(ae),dt.setValue(B,"projectionMatrix",ae)):dt.setValue(B,"projectionMatrix",y.projectionMatrix),dt.setValue(B,"viewMatrix",y.matrixWorldInverse);let nn=dt.map.cameraPosition;nn!==void 0&&nn.setValue(B,Re.setFromMatrixPosition(y.matrixWorld)),We.logarithmicDepthBuffer&&dt.setValue(B,"logDepthBufFC",2/(Math.log(y.far+1)/Math.LN2)),(Q.isMeshPhongMaterial||Q.isMeshToonMaterial||Q.isMeshLambertMaterial||Q.isMeshBasicMaterial||Q.isMeshStandardMaterial||Q.isShaderMaterial)&&dt.setValue(B,"isOrthographic",y.isOrthographicCamera===!0),x!==y&&(x=y,hn=!0,Lr=!0)}if(P.isSkinnedMesh){dt.setOptional(B,P,"bindMatrix"),dt.setOptional(B,P,"bindMatrixInverse");let Jt=P.skeleton;Jt&&(Jt.boneTexture===null&&Jt.computeBoneTexture(),dt.setValue(B,"boneTexture",Jt.boneTexture,S))}P.isBatchedMesh&&(dt.setOptional(B,P,"batchingTexture"),dt.setValue(B,"batchingTexture",P._matricesTexture,S),dt.setOptional(B,P,"batchingIdTexture"),dt.setValue(B,"batchingIdTexture",P._indirectTexture,S),dt.setOptional(B,P,"batchingColorTexture"),P._colorsTexture!==null&&dt.setValue(B,"batchingColorTexture",P._colorsTexture,S));let En=O.morphAttributes;if((En.position!==void 0||En.normal!==void 0||En.color!==void 0)&&we.update(P,O,wn),(hn||Ie.receiveShadow!==P.receiveShadow)&&(Ie.receiveShadow=P.receiveShadow,dt.setValue(B,"receiveShadow",P.receiveShadow)),Q.isMeshGouraudMaterial&&Q.envMap!==null&&(_n.envMap.value=me,_n.flipEnvMap.value=me.isCubeTexture&&me.isRenderTargetTexture===!1?-1:1),Q.isMeshStandardMaterial&&Q.envMap===null&&L.environment!==null&&(_n.envMapIntensity.value=L.environmentIntensity),hn&&(dt.setValue(B,"toneMappingExposure",E.toneMappingExposure),Ie.needsLights&&Np(_n,Lr),$&&Q.fog===!0&&ce.refreshFogUniforms(_n,$),ce.refreshMaterialUniforms(_n,Q,k,J,A.state.transmissionRenderTarget[y.id]),Er.upload(B,Ku(Ie),_n,S)),Q.isShaderMaterial&&Q.uniformsNeedUpdate===!0&&(Er.upload(B,Ku(Ie),_n,S),Q.uniformsNeedUpdate=!1),Q.isSpriteMaterial&&dt.setValue(B,"center",P.center),dt.setValue(B,"modelViewMatrix",P.modelViewMatrix),dt.setValue(B,"normalMatrix",P.normalMatrix),dt.setValue(B,"modelMatrix",P.matrixWorld),Q.isShaderMaterial||Q.isRawShaderMaterial){let Jt=Q.uniformsGroups;for(let nn=0,Xc=Jt.length;nn<Xc;nn++){let Wi=Jt[nn];D.update(Wi,wn),D.bind(Wi,wn)}}return wn}function Np(y,L){y.ambientLightColor.needsUpdate=L,y.lightProbe.needsUpdate=L,y.directionalLights.needsUpdate=L,y.directionalLightShadows.needsUpdate=L,y.pointLights.needsUpdate=L,y.pointLightShadows.needsUpdate=L,y.spotLights.needsUpdate=L,y.spotLightShadows.needsUpdate=L,y.rectAreaLights.needsUpdate=L,y.hemisphereLights.needsUpdate=L}function Op(y){return y.isMeshLambertMaterial||y.isMeshToonMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isShadowMaterial||y.isShaderMaterial&&y.lights===!0}this.getActiveCubeFace=function(){return v},this.getActiveMipmapLevel=function(){return T},this.getRenderTarget=function(){return F},this.setRenderTargetTextures=function(y,L,O){xe.get(y.texture).__webglTexture=L,xe.get(y.depthTexture).__webglTexture=O;let Q=xe.get(y);Q.__hasExternalTextures=!0,Q.__autoAllocateDepthBuffer=O===void 0,Q.__autoAllocateDepthBuffer||ze.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),Q.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(y,L){let O=xe.get(y);O.__webglFramebuffer=L,O.__useDefaultFramebuffer=L===void 0};let Qp=B.createFramebuffer();this.setRenderTarget=function(y,L=0,O=0){F=y,v=L,T=O;let Q=!0,P=null,$=!1,oe=!1;if(y){let me=xe.get(y);if(me.__useDefaultFramebuffer!==void 0)Ce.bindFramebuffer(B.FRAMEBUFFER,null),Q=!1;else if(me.__webglFramebuffer===void 0)S.setupRenderTarget(y);else if(me.__hasExternalTextures)S.rebindTextures(y,xe.get(y.texture).__webglTexture,xe.get(y.depthTexture).__webglTexture);else if(y.depthBuffer){let Me=y.depthTexture;if(me.__boundDepthTexture!==Me){if(Me!==null&&xe.has(Me)&&(y.width!==Me.image.width||y.height!==Me.image.height))throw new Error("WebGLRenderTarget: Attached DepthTexture is initialized to the incorrect size.");S.setupDepthRenderbuffer(y)}}let be=y.texture;(be.isData3DTexture||be.isDataArrayTexture||be.isCompressedArrayTexture)&&(oe=!0);let De=xe.get(y).__webglFramebuffer;y.isWebGLCubeRenderTarget?(Array.isArray(De[L])?P=De[L][O]:P=De[L],$=!0):y.samples>0&&S.useMultisampledRTT(y)===!1?P=xe.get(y).__webglMultisampledFramebuffer:Array.isArray(De)?P=De[O]:P=De,R.copy(y.viewport),G.copy(y.scissor),N=y.scissorTest}else R.copy(ge).multiplyScalar(k).floor(),G.copy(Be).multiplyScalar(k).floor(),N=Ve;if(O!==0&&(P=Qp),Ce.bindFramebuffer(B.FRAMEBUFFER,P)&&Q&&Ce.drawBuffers(y,P),Ce.viewport(R),Ce.scissor(G),Ce.setScissorTest(N),$){let me=xe.get(y.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_CUBE_MAP_POSITIVE_X+L,me.__webglTexture,O)}else if(oe){let me=xe.get(y.texture),be=L;B.framebufferTextureLayer(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,me.__webglTexture,O,be)}else if(y!==null&&O!==0){let me=xe.get(y.texture);B.framebufferTexture2D(B.FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,me.__webglTexture,O)}M=-1},this.readRenderTargetPixels=function(y,L,O,Q,P,$,oe){if(!(y&&y.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let de=xe.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&oe!==void 0&&(de=de[oe]),de){Ce.bindFramebuffer(B.FRAMEBUFFER,de);try{let me=y.texture,be=me.format,De=me.type;if(!We.textureFormatReadable(be)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(!We.textureTypeReadable(De)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}L>=0&&L<=y.width-Q&&O>=0&&O<=y.height-P&&B.readPixels(L,O,Q,P,Ue.convert(be),Ue.convert(De),$)}finally{let me=F!==null?xe.get(F).__webglFramebuffer:null;Ce.bindFramebuffer(B.FRAMEBUFFER,me)}}},this.readRenderTargetPixelsAsync=async function(y,L,O,Q,P,$,oe){if(!(y&&y.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let de=xe.get(y).__webglFramebuffer;if(y.isWebGLCubeRenderTarget&&oe!==void 0&&(de=de[oe]),de){let me=y.texture,be=me.format,De=me.type;if(!We.textureFormatReadable(be))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(!We.textureTypeReadable(De))throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");if(L>=0&&L<=y.width-Q&&O>=0&&O<=y.height-P){Ce.bindFramebuffer(B.FRAMEBUFFER,de);let Me=B.createBuffer();B.bindBuffer(B.PIXEL_PACK_BUFFER,Me),B.bufferData(B.PIXEL_PACK_BUFFER,$.byteLength,B.STREAM_READ),B.readPixels(L,O,Q,P,Ue.convert(be),Ue.convert(De),0);let Je=F!==null?xe.get(F).__webglFramebuffer:null;Ce.bindFramebuffer(B.FRAMEBUFFER,Je);let tt=B.fenceSync(B.SYNC_GPU_COMMANDS_COMPLETE,0);return B.flush(),await _f(B,tt,4),B.bindBuffer(B.PIXEL_PACK_BUFFER,Me),B.getBufferSubData(B.PIXEL_PACK_BUFFER,0,$),B.deleteBuffer(Me),B.deleteSync(tt),$}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")}},this.copyFramebufferToTexture=function(y,L=null,O=0){y.isTexture!==!0&&(ys("WebGLRenderer: copyFramebufferToTexture function signature has changed."),L=arguments[0]||null,y=arguments[1]);let Q=Math.pow(2,-O),P=Math.floor(y.image.width*Q),$=Math.floor(y.image.height*Q),oe=L!==null?L.x:0,de=L!==null?L.y:0;S.setTexture2D(y,0),B.copyTexSubImage2D(B.TEXTURE_2D,O,0,0,oe,de,P,$),Ce.unbindTexture()};let kp=B.createFramebuffer(),Gp=B.createFramebuffer();this.copyTextureToTexture=function(y,L,O=null,Q=null,P=0,$=null){y.isTexture!==!0&&(ys("WebGLRenderer: copyTextureToTexture function signature has changed."),Q=arguments[0]||null,y=arguments[1],L=arguments[2],$=arguments[3]||0,O=null),$===null&&(P!==0?(ys("WebGLRenderer: copyTextureToTexture function signature has changed to support src and dst mipmap levels."),$=P,P=0):$=0);let oe,de,me,be,De,Me,Je,tt,xt,_t=y.isCompressedTexture?y.mipmaps[$]:y.image;if(O!==null)oe=O.max.x-O.min.x,de=O.max.y-O.min.y,me=O.isBox3?O.max.z-O.min.z:1,be=O.min.x,De=O.min.y,Me=O.isBox3?O.min.z:0;else{let En=Math.pow(2,-P);oe=Math.floor(_t.width*En),de=Math.floor(_t.height*En),y.isDataArrayTexture?me=_t.depth:y.isData3DTexture?me=Math.floor(_t.depth*En):me=1,be=0,De=0,Me=0}Q!==null?(Je=Q.x,tt=Q.y,xt=Q.z):(Je=0,tt=0,xt=0);let Ze=Ue.convert(L.format),Ie=Ue.convert(L.type),Lt;L.isData3DTexture?(S.setTexture3D(L,0),Lt=B.TEXTURE_3D):L.isDataArrayTexture||L.isCompressedArrayTexture?(S.setTexture2DArray(L,0),Lt=B.TEXTURE_2D_ARRAY):(S.setTexture2D(L,0),Lt=B.TEXTURE_2D),B.pixelStorei(B.UNPACK_FLIP_Y_WEBGL,L.flipY),B.pixelStorei(B.UNPACK_PREMULTIPLY_ALPHA_WEBGL,L.premultiplyAlpha),B.pixelStorei(B.UNPACK_ALIGNMENT,L.unpackAlignment);let nt=B.getParameter(B.UNPACK_ROW_LENGTH),wn=B.getParameter(B.UNPACK_IMAGE_HEIGHT),Us=B.getParameter(B.UNPACK_SKIP_PIXELS),hn=B.getParameter(B.UNPACK_SKIP_ROWS),Lr=B.getParameter(B.UNPACK_SKIP_IMAGES);B.pixelStorei(B.UNPACK_ROW_LENGTH,_t.width),B.pixelStorei(B.UNPACK_IMAGE_HEIGHT,_t.height),B.pixelStorei(B.UNPACK_SKIP_PIXELS,be),B.pixelStorei(B.UNPACK_SKIP_ROWS,De),B.pixelStorei(B.UNPACK_SKIP_IMAGES,Me);let dt=y.isDataArrayTexture||y.isData3DTexture,_n=L.isDataArrayTexture||L.isData3DTexture;if(y.isDepthTexture){let En=xe.get(y),Jt=xe.get(L),nn=xe.get(En.__renderTarget),Xc=xe.get(Jt.__renderTarget);Ce.bindFramebuffer(B.READ_FRAMEBUFFER,nn.__webglFramebuffer),Ce.bindFramebuffer(B.DRAW_FRAMEBUFFER,Xc.__webglFramebuffer);for(let Wi=0;Wi<me;Wi++)dt&&(B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,xe.get(y).__webglTexture,P,Me+Wi),B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,xe.get(L).__webglTexture,$,xt+Wi)),B.blitFramebuffer(be,De,oe,de,Je,tt,oe,de,B.DEPTH_BUFFER_BIT,B.NEAREST);Ce.bindFramebuffer(B.READ_FRAMEBUFFER,null),Ce.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else if(P!==0||y.isRenderTargetTexture||xe.has(y)){let En=xe.get(y),Jt=xe.get(L);Ce.bindFramebuffer(B.READ_FRAMEBUFFER,kp),Ce.bindFramebuffer(B.DRAW_FRAMEBUFFER,Gp);for(let nn=0;nn<me;nn++)dt?B.framebufferTextureLayer(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,En.__webglTexture,P,Me+nn):B.framebufferTexture2D(B.READ_FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,En.__webglTexture,P),_n?B.framebufferTextureLayer(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,Jt.__webglTexture,$,xt+nn):B.framebufferTexture2D(B.DRAW_FRAMEBUFFER,B.COLOR_ATTACHMENT0,B.TEXTURE_2D,Jt.__webglTexture,$),P!==0?B.blitFramebuffer(be,De,oe,de,Je,tt,oe,de,B.COLOR_BUFFER_BIT,B.NEAREST):_n?B.copyTexSubImage3D(Lt,$,Je,tt,xt+nn,be,De,oe,de):B.copyTexSubImage2D(Lt,$,Je,tt,be,De,oe,de);Ce.bindFramebuffer(B.READ_FRAMEBUFFER,null),Ce.bindFramebuffer(B.DRAW_FRAMEBUFFER,null)}else _n?y.isDataTexture||y.isData3DTexture?B.texSubImage3D(Lt,$,Je,tt,xt,oe,de,me,Ze,Ie,_t.data):L.isCompressedArrayTexture?B.compressedTexSubImage3D(Lt,$,Je,tt,xt,oe,de,me,Ze,_t.data):B.texSubImage3D(Lt,$,Je,tt,xt,oe,de,me,Ze,Ie,_t):y.isDataTexture?B.texSubImage2D(B.TEXTURE_2D,$,Je,tt,oe,de,Ze,Ie,_t.data):y.isCompressedTexture?B.compressedTexSubImage2D(B.TEXTURE_2D,$,Je,tt,_t.width,_t.height,Ze,_t.data):B.texSubImage2D(B.TEXTURE_2D,$,Je,tt,oe,de,Ze,Ie,_t);B.pixelStorei(B.UNPACK_ROW_LENGTH,nt),B.pixelStorei(B.UNPACK_IMAGE_HEIGHT,wn),B.pixelStorei(B.UNPACK_SKIP_PIXELS,Us),B.pixelStorei(B.UNPACK_SKIP_ROWS,hn),B.pixelStorei(B.UNPACK_SKIP_IMAGES,Lr),$===0&&L.generateMipmaps&&B.generateMipmap(Lt),Ce.unbindTexture()},this.copyTextureToTexture3D=function(y,L,O=null,Q=null,P=0){return y.isTexture!==!0&&(ys("WebGLRenderer: copyTextureToTexture3D function signature has changed."),O=arguments[0]||null,Q=arguments[1]||null,y=arguments[2],L=arguments[3],P=arguments[4]||0),ys('WebGLRenderer: copyTextureToTexture3D function has been deprecated. Use "copyTextureToTexture" instead.'),this.copyTextureToTexture(y,L,O,Q,P)},this.initRenderTarget=function(y){xe.get(y).__webglFramebuffer===void 0&&S.setupRenderTarget(y)},this.initTexture=function(y){y.isCubeTexture?S.setTextureCube(y,0):y.isData3DTexture?S.setTexture3D(y,0):y.isDataArrayTexture||y.isCompressedArrayTexture?S.setTexture2DArray(y,0):S.setTexture2D(y,0),Ce.unbindTexture()},this.resetState=function(){v=0,T=0,F=null,Ce.reset(),lt.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return kn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;let t=this.getContext();t.drawingBufferColorspace=Qe._getDrawingBufferColorSpace(e),t.unpackColorSpace=Qe._getUnpackColorSpace()}};var $f={type:"change"},gh={type:"start"},tA={type:"end"},pc=new ci,eA=new xn,Ay=Math.cos(70*xo.DEG2RAD),Bt=new b,cn=2*Math.PI,ot={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},mh=1e-6,mc=class extends mo{constructor(e,t=null){super(e,t),this.state=ot.NONE,this.enabled=!0,this.target=new b,this.cursor=new b,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Pi.ROTATE,MIDDLE:Pi.DOLLY,RIGHT:Pi.PAN},this.touches={ONE:Fi.ROTATE,TWO:Fi.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this._lastPosition=new b,this._lastQuaternion=new jt,this._lastTargetPosition=new b,this._quat=new jt().setFromUnitVectors(e.up,new b(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new Kn,this._sphericalDelta=new Kn,this._scale=1,this._panOffset=new b,this._rotateStart=new ve,this._rotateEnd=new ve,this._rotateDelta=new ve,this._panStart=new ve,this._panEnd=new ve,this._panDelta=new ve,this._dollyStart=new ve,this._dollyEnd=new ve,this._dollyDelta=new ve,this._dollyDirection=new b,this._mouse=new ve,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=my.bind(this),this._onPointerDown=py.bind(this),this._onPointerUp=gy.bind(this),this._onContextMenu=Iy.bind(this),this._onMouseWheel=yy.bind(this),this._onKeyDown=xy.bind(this),this._onTouchStart=Cy.bind(this),this._onTouchMove=My.bind(this),this._onMouseDown=_y.bind(this),this._onMouseMove=Ey.bind(this),this._interceptControlDown=Sy.bind(this),this._interceptControlUp=vy.bind(this),this.domElement!==null&&this.connect(),this.update()}connect(){this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents(),this.domElement.getRootNode().removeEventListener("keydown",this._interceptControlDown,{capture:!0}),this.domElement.style.touchAction="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(e){e.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=e}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent($f),this.update(),this.state=ot.NONE}update(e=null){let t=this.object.position;Bt.copy(t).sub(this.target),Bt.applyQuaternion(this._quat),this._spherical.setFromVector3(Bt),this.autoRotate&&this.state===ot.NONE&&this._rotateLeft(this._getAutoRotationAngle(e)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(n)&&isFinite(s)&&(n<-Math.PI?n+=cn:n>Math.PI&&(n-=cn),s<-Math.PI?s+=cn:s>Math.PI&&(s-=cn),n<=s?this._spherical.theta=Math.max(n,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+s)/2?Math.max(n,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=o!=this._spherical.radius}if(Bt.setFromSpherical(this._spherical),Bt.applyQuaternion(this._quatInverse),t.copy(this.target).add(Bt),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){let a=Bt.length();o=this._clampDistance(a*this._scale);let c=a-o;this.object.position.addScaledVector(this._dollyDirection,c),this.object.updateMatrixWorld(),r=!!c}else if(this.object.isOrthographicCamera){let a=new b(this._mouse.x,this._mouse.y,0);a.unproject(this.object);let c=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=c!==this.object.zoom;let l=new b(this._mouse.x,this._mouse.y,0);l.unproject(this.object),this.object.position.sub(l).add(a),this.object.updateMatrixWorld(),o=Bt.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(pc.origin.copy(this.object.position),pc.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(pc.direction))<Ay?this.object.lookAt(this.target):(eA.setFromNormalAndCoplanarPoint(this.object.up,this.target),pc.intersectPlane(eA,this.target))))}else if(this.object.isOrthographicCamera){let o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>mh||8*(1-this._lastQuaternion.dot(this.object.quaternion))>mh||this._lastTargetPosition.distanceToSquared(this.target)>mh?(this.dispatchEvent($f),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(e){return e!==null?cn/60*this.autoRotateSpeed*e:cn/60/60*this.autoRotateSpeed}_getZoomScale(e){let t=Math.abs(e*.01);return Math.pow(.95,this.zoomSpeed*t)}_rotateLeft(e){this._sphericalDelta.theta-=e}_rotateUp(e){this._sphericalDelta.phi-=e}_panLeft(e,t){Bt.setFromMatrixColumn(t,0),Bt.multiplyScalar(-e),this._panOffset.add(Bt)}_panUp(e,t){this.screenSpacePanning===!0?Bt.setFromMatrixColumn(t,1):(Bt.setFromMatrixColumn(t,0),Bt.crossVectors(this.object.up,Bt)),Bt.multiplyScalar(e),this._panOffset.add(Bt)}_pan(e,t){let n=this.domElement;if(this.object.isPerspectiveCamera){let s=this.object.position;Bt.copy(s).sub(this.target);let r=Bt.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*e*r/n.clientHeight,this.object.matrix),this._panUp(2*t*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(e*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(t*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(e){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=e:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(e,t){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),s=e-n.left,r=t-n.top,o=n.width,a=n.height;this._mouse.x=s/o*2-1,this._mouse.y=-(r/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(e){return Math.max(this.minDistance,Math.min(this.maxDistance,e))}_handleMouseDownRotate(e){this._rotateStart.set(e.clientX,e.clientY)}_handleMouseDownDolly(e){this._updateZoomParameters(e.clientX,e.clientX),this._dollyStart.set(e.clientX,e.clientY)}_handleMouseDownPan(e){this._panStart.set(e.clientX,e.clientY)}_handleMouseMoveRotate(e){this._rotateEnd.set(e.clientX,e.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(cn*this._rotateDelta.x/t.clientHeight),this._rotateUp(cn*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(e){this._dollyEnd.set(e.clientX,e.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(e){this._panEnd.set(e.clientX,e.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(e){this._updateZoomParameters(e.clientX,e.clientY),e.deltaY<0?this._dollyIn(this._getZoomScale(e.deltaY)):e.deltaY>0&&this._dollyOut(this._getZoomScale(e.deltaY)),this.update()}_handleKeyDown(e){let t=!1;switch(e.code){case this.keys.UP:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(cn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),t=!0;break;case this.keys.BOTTOM:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateUp(-cn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),t=!0;break;case this.keys.LEFT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(cn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),t=!0;break;case this.keys.RIGHT:e.ctrlKey||e.metaKey||e.shiftKey?this.enableRotate&&this._rotateLeft(-cn*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),t=!0;break}t&&(e.preventDefault(),this.update())}_handleTouchStartRotate(e){if(this._pointers.length===1)this._rotateStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._rotateStart.set(n,s)}}_handleTouchStartPan(e){if(this._pointers.length===1)this._panStart.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._panStart.set(n,s)}}_handleTouchStartDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,s=e.pageY-t.y,r=Math.sqrt(n*n+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enablePan&&this._handleTouchStartPan(e)}_handleTouchStartDollyRotate(e){this.enableZoom&&this._handleTouchStartDolly(e),this.enableRotate&&this._handleTouchStartRotate(e)}_handleTouchMoveRotate(e){if(this._pointers.length==1)this._rotateEnd.set(e.pageX,e.pageY);else{let n=this._getSecondPointerPosition(e),s=.5*(e.pageX+n.x),r=.5*(e.pageY+n.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let t=this.domElement;this._rotateLeft(cn*this._rotateDelta.x/t.clientHeight),this._rotateUp(cn*this._rotateDelta.y/t.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(e){if(this._pointers.length===1)this._panEnd.set(e.pageX,e.pageY);else{let t=this._getSecondPointerPosition(e),n=.5*(e.pageX+t.x),s=.5*(e.pageY+t.y);this._panEnd.set(n,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(e){let t=this._getSecondPointerPosition(e),n=e.pageX-t.x,s=e.pageY-t.y,r=Math.sqrt(n*n+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let o=(e.pageX+t.x)*.5,a=(e.pageY+t.y)*.5;this._updateZoomParameters(o,a)}_handleTouchMoveDollyPan(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enablePan&&this._handleTouchMovePan(e)}_handleTouchMoveDollyRotate(e){this.enableZoom&&this._handleTouchMoveDolly(e),this.enableRotate&&this._handleTouchMoveRotate(e)}_addPointer(e){this._pointers.push(e.pointerId)}_removePointer(e){delete this._pointerPositions[e.pointerId];for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId){this._pointers.splice(t,1);return}}_isTrackingPointer(e){for(let t=0;t<this._pointers.length;t++)if(this._pointers[t]==e.pointerId)return!0;return!1}_trackPointer(e){let t=this._pointerPositions[e.pointerId];t===void 0&&(t=new ve,this._pointerPositions[e.pointerId]=t),t.set(e.pageX,e.pageY)}_getSecondPointerPosition(e){let t=e.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[t]}_customWheelEvent(e){let t=e.deltaMode,n={clientX:e.clientX,clientY:e.clientY,deltaY:e.deltaY};switch(t){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return e.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function py(i){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(i.pointerId),this.domElement.addEventListener("pointermove",this._onPointerMove),this.domElement.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(i)&&(this._addPointer(i),i.pointerType==="touch"?this._onTouchStart(i):this._onMouseDown(i)))}function my(i){this.enabled!==!1&&(i.pointerType==="touch"?this._onTouchMove(i):this._onMouseMove(i))}function gy(i){switch(this._removePointer(i),this._pointers.length){case 0:this.domElement.releasePointerCapture(i.pointerId),this.domElement.removeEventListener("pointermove",this._onPointerMove),this.domElement.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(tA),this.state=ot.NONE;break;case 1:let e=this._pointers[0],t=this._pointerPositions[e];this._onTouchStart({pointerId:e,pageX:t.x,pageY:t.y});break}}function _y(i){let e;switch(i.button){case 0:e=this.mouseButtons.LEFT;break;case 1:e=this.mouseButtons.MIDDLE;break;case 2:e=this.mouseButtons.RIGHT;break;default:e=-1}switch(e){case Pi.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(i),this.state=ot.DOLLY;break;case Pi.ROTATE:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=ot.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=ot.ROTATE}break;case Pi.PAN:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=ot.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=ot.PAN}break;default:this.state=ot.NONE}this.state!==ot.NONE&&this.dispatchEvent(gh)}function Ey(i){switch(this.state){case ot.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(i);break;case ot.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(i);break;case ot.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(i);break}}function yy(i){this.enabled===!1||this.enableZoom===!1||this.state!==ot.NONE||(i.preventDefault(),this.dispatchEvent(gh),this._handleMouseWheel(this._customWheelEvent(i)),this.dispatchEvent(tA))}function xy(i){this.enabled!==!1&&this._handleKeyDown(i)}function Cy(i){switch(this._trackPointer(i),this._pointers.length){case 1:switch(this.touches.ONE){case Fi.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(i),this.state=ot.TOUCH_ROTATE;break;case Fi.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(i),this.state=ot.TOUCH_PAN;break;default:this.state=ot.NONE}break;case 2:switch(this.touches.TWO){case Fi.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(i),this.state=ot.TOUCH_DOLLY_PAN;break;case Fi.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(i),this.state=ot.TOUCH_DOLLY_ROTATE;break;default:this.state=ot.NONE}break;default:this.state=ot.NONE}this.state!==ot.NONE&&this.dispatchEvent(gh)}function My(i){switch(this._trackPointer(i),this.state){case ot.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(i),this.update();break;case ot.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(i),this.update();break;case ot.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(i),this.update();break;case ot.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(i),this.update();break;default:this.state=ot.NONE}}function Iy(i){this.enabled!==!1&&i.preventDefault()}function Sy(i){i.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function vy(i){i.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function _h(i,e){if(e===Wl)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),i;if(e===mr||e===yo){let t=i.getIndex();if(t===null){let o=[],a=i.getAttribute("position");if(a!==void 0){for(let c=0;c<a.count;c++)o.push(c);i.setIndex(o),t=i.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),i}let n=t.count-2,s=[];if(e===mr)for(let o=1;o<=n;o++)s.push(t.getX(0)),s.push(t.getX(o)),s.push(t.getX(o+1));else for(let o=0;o<n;o++)o%2===0?(s.push(t.getX(o)),s.push(t.getX(o+1)),s.push(t.getX(o+2))):(s.push(t.getX(o+2)),s.push(t.getX(o+1)),s.push(t.getX(o)));s.length/3!==n&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");let r=i.clone();return r.setIndex(s),r.clearGroups(),r}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",e),i}var gc=class extends on{constructor(e){super(e),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new Sh(t)}),this.register(function(t){return new vh(t)}),this.register(function(t){return new Fh(t)}),this.register(function(t){return new Uh(t)}),this.register(function(t){return new Nh(t)}),this.register(function(t){return new wh(t)}),this.register(function(t){return new bh(t)}),this.register(function(t){return new Bh(t)}),this.register(function(t){return new Rh(t)}),this.register(function(t){return new Ih(t)}),this.register(function(t){return new Dh(t)}),this.register(function(t){return new Th(t)}),this.register(function(t){return new Ph(t)}),this.register(function(t){return new Lh(t)}),this.register(function(t){return new Ch(t)}),this.register(function(t){return new Oh(t)}),this.register(function(t){return new Qh(t)})}load(e,t,n,s){let r=this,o;if(this.resourcePath!=="")o=this.resourcePath;else if(this.path!==""){let l=di.extractUrlBase(e);o=di.resolveURL(l,this.path)}else o=di.extractUrlBase(e);this.manager.itemStart(e);let a=function(l){s?s(l):console.error(l),r.manager.itemError(e),r.manager.itemEnd(e)},c=new pn(this.manager);c.setPath(this.path),c.setResponseType("arraybuffer"),c.setRequestHeader(this.requestHeader),c.setWithCredentials(this.withCredentials),c.load(e,function(l){try{r.parse(l,o,function(h){t(h),r.manager.itemEnd(e)},a)}catch(h){a(h)}},n,a)}setDRACOLoader(e){return this.dracoLoader=e,this}setKTX2Loader(e){return this.ktx2Loader=e,this}setMeshoptDecoder(e){return this.meshoptDecoder=e,this}register(e){return this.pluginCallbacks.indexOf(e)===-1&&this.pluginCallbacks.push(e),this}unregister(e){return this.pluginCallbacks.indexOf(e)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(e),1),this}parse(e,t,n,s){let r,o={},a={},c=new TextDecoder;if(typeof e=="string")r=JSON.parse(e);else if(e instanceof ArrayBuffer)if(c.decode(new Uint8Array(e,0,4))===oA){try{o[Ge.KHR_BINARY_GLTF]=new kh(e)}catch(u){s&&s(u);return}r=JSON.parse(o[Ge.KHR_BINARY_GLTF].content)}else r=JSON.parse(c.decode(e));else r=e;if(r.asset===void 0||r.asset.version[0]<2){s&&s(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}let l=new Xh(r,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});l.fileLoader.setRequestHeader(this.requestHeader);for(let h=0;h<this.pluginCallbacks.length;h++){let u=this.pluginCallbacks[h](l);u.name||console.error("THREE.GLTFLoader: Invalid plugin found: missing name"),a[u.name]=u,o[u.name]=!0}if(r.extensionsUsed)for(let h=0;h<r.extensionsUsed.length;++h){let u=r.extensionsUsed[h],d=r.extensionsRequired||[];switch(u){case Ge.KHR_MATERIALS_UNLIT:o[u]=new Mh;break;case Ge.KHR_DRACO_MESH_COMPRESSION:o[u]=new Gh(r,this.dracoLoader);break;case Ge.KHR_TEXTURE_TRANSFORM:o[u]=new Hh;break;case Ge.KHR_MESH_QUANTIZATION:o[u]=new Vh;break;default:d.indexOf(u)>=0&&a[u]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+u+'".')}}l.setExtensions(o),l.setPlugins(a),l.parse(n,s)}parseAsync(e,t){let n=this;return new Promise(function(s,r){n.parse(e,t,s,r)})}};function Ty(){let i={};return{get:function(e){return i[e]},add:function(e,t){i[e]=t},remove:function(e){delete i[e]},removeAll:function(){i={}}}}var Ge={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_DISPERSION:"KHR_materials_dispersion",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_MATERIALS_BUMP:"EXT_materials_bump",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"},Ch=class{constructor(e){this.parser=e,this.name=Ge.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){let e=this.parser,t=this.parser.json.nodes||[];for(let n=0,s=t.length;n<s;n++){let r=t[n];r.extensions&&r.extensions[this.name]&&r.extensions[this.name].light!==void 0&&e._addNodeRef(this.cache,r.extensions[this.name].light)}}_loadLight(e){let t=this.parser,n="light:"+e,s=t.cache.get(n);if(s)return s;let r=t.json,c=((r.extensions&&r.extensions[this.name]||{}).lights||[])[e],l,h=new Ee(16777215);c.color!==void 0&&h.setRGB(c.color[0],c.color[1],c.color[2],yt);let u=c.range!==void 0?c.range:0;switch(c.type){case"directional":l=new us(h),l.target.position.set(0,0,-1),l.add(l.target);break;case"point":l=new ls(h),l.distance=u;break;case"spot":l=new fo(h),l.distance=u,c.spot=c.spot||{},c.spot.innerConeAngle=c.spot.innerConeAngle!==void 0?c.spot.innerConeAngle:0,c.spot.outerConeAngle=c.spot.outerConeAngle!==void 0?c.spot.outerConeAngle:Math.PI/4,l.angle=c.spot.outerConeAngle,l.penumbra=1-c.spot.innerConeAngle/c.spot.outerConeAngle,l.target.position.set(0,0,-1),l.add(l.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+c.type)}return l.position.set(0,0,0),l.decay=2,mi(l,c),c.intensity!==void 0&&(l.intensity=c.intensity),l.name=t.createUniqueName(c.name||"light_"+e),s=Promise.resolve(l),t.cache.add(n,s),s}getDependency(e,t){if(e==="light")return this._loadLight(t)}createNodeAttachment(e){let t=this,n=this.parser,r=n.json.nodes[e],a=(r.extensions&&r.extensions[this.name]||{}).light;return a===void 0?null:this._loadLight(a).then(function(c){return n._getNodeRef(t.cache,a,c)})}},Mh=class{constructor(){this.name=Ge.KHR_MATERIALS_UNLIT}getMaterialType(){return en}extendParams(e,t,n){let s=[];e.color=new Ee(1,1,1),e.opacity=1;let r=t.pbrMetallicRoughness;if(r){if(Array.isArray(r.baseColorFactor)){let o=r.baseColorFactor;e.color.setRGB(o[0],o[1],o[2],yt),e.opacity=o[3]}r.baseColorTexture!==void 0&&s.push(n.assignTexture(e,"map",r.baseColorTexture,et))}return Promise.all(s)}},Ih=class{constructor(e){this.parser=e,this.name=Ge.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(e,t){let s=this.parser.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=s.extensions[this.name].emissiveStrength;return r!==void 0&&(t.emissiveIntensity=r),Promise.resolve()}},Sh=class{constructor(e){this.parser=e,this.name=Ge.KHR_MATERIALS_CLEARCOAT}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:rn}extendMaterialParams(e,t){let n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[],o=s.extensions[this.name];if(o.clearcoatFactor!==void 0&&(t.clearcoat=o.clearcoatFactor),o.clearcoatTexture!==void 0&&r.push(n.assignTexture(t,"clearcoatMap",o.clearcoatTexture)),o.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=o.clearcoatRoughnessFactor),o.clearcoatRoughnessTexture!==void 0&&r.push(n.assignTexture(t,"clearcoatRoughnessMap",o.clearcoatRoughnessTexture)),o.clearcoatNormalTexture!==void 0&&(r.push(n.assignTexture(t,"clearcoatNormalMap",o.clearcoatNormalTexture)),o.clearcoatNormalTexture.scale!==void 0)){let a=o.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new ve(a,a)}return Promise.all(r)}},vh=class{constructor(e){this.parser=e,this.name=Ge.KHR_MATERIALS_DISPERSION}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:rn}extendMaterialParams(e,t){let s=this.parser.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=s.extensions[this.name];return t.dispersion=r.dispersion!==void 0?r.dispersion:0,Promise.resolve()}},Th=class{constructor(e){this.parser=e,this.name=Ge.KHR_MATERIALS_IRIDESCENCE}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:rn}extendMaterialParams(e,t){let n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[],o=s.extensions[this.name];return o.iridescenceFactor!==void 0&&(t.iridescence=o.iridescenceFactor),o.iridescenceTexture!==void 0&&r.push(n.assignTexture(t,"iridescenceMap",o.iridescenceTexture)),o.iridescenceIor!==void 0&&(t.iridescenceIOR=o.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),o.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=o.iridescenceThicknessMinimum),o.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=o.iridescenceThicknessMaximum),o.iridescenceThicknessTexture!==void 0&&r.push(n.assignTexture(t,"iridescenceThicknessMap",o.iridescenceThicknessTexture)),Promise.all(r)}},wh=class{constructor(e){this.parser=e,this.name=Ge.KHR_MATERIALS_SHEEN}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:rn}extendMaterialParams(e,t){let n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[];t.sheenColor=new Ee(0,0,0),t.sheenRoughness=0,t.sheen=1;let o=s.extensions[this.name];if(o.sheenColorFactor!==void 0){let a=o.sheenColorFactor;t.sheenColor.setRGB(a[0],a[1],a[2],yt)}return o.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=o.sheenRoughnessFactor),o.sheenColorTexture!==void 0&&r.push(n.assignTexture(t,"sheenColorMap",o.sheenColorTexture,et)),o.sheenRoughnessTexture!==void 0&&r.push(n.assignTexture(t,"sheenRoughnessMap",o.sheenRoughnessTexture)),Promise.all(r)}},bh=class{constructor(e){this.parser=e,this.name=Ge.KHR_MATERIALS_TRANSMISSION}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:rn}extendMaterialParams(e,t){let n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[],o=s.extensions[this.name];return o.transmissionFactor!==void 0&&(t.transmission=o.transmissionFactor),o.transmissionTexture!==void 0&&r.push(n.assignTexture(t,"transmissionMap",o.transmissionTexture)),Promise.all(r)}},Bh=class{constructor(e){this.parser=e,this.name=Ge.KHR_MATERIALS_VOLUME}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:rn}extendMaterialParams(e,t){let n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[],o=s.extensions[this.name];t.thickness=o.thicknessFactor!==void 0?o.thicknessFactor:0,o.thicknessTexture!==void 0&&r.push(n.assignTexture(t,"thicknessMap",o.thicknessTexture)),t.attenuationDistance=o.attenuationDistance||1/0;let a=o.attenuationColor||[1,1,1];return t.attenuationColor=new Ee().setRGB(a[0],a[1],a[2],yt),Promise.all(r)}},Rh=class{constructor(e){this.parser=e,this.name=Ge.KHR_MATERIALS_IOR}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:rn}extendMaterialParams(e,t){let s=this.parser.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=s.extensions[this.name];return t.ior=r.ior!==void 0?r.ior:1.5,Promise.resolve()}},Dh=class{constructor(e){this.parser=e,this.name=Ge.KHR_MATERIALS_SPECULAR}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:rn}extendMaterialParams(e,t){let n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[],o=s.extensions[this.name];t.specularIntensity=o.specularFactor!==void 0?o.specularFactor:1,o.specularTexture!==void 0&&r.push(n.assignTexture(t,"specularIntensityMap",o.specularTexture));let a=o.specularColorFactor||[1,1,1];return t.specularColor=new Ee().setRGB(a[0],a[1],a[2],yt),o.specularColorTexture!==void 0&&r.push(n.assignTexture(t,"specularColorMap",o.specularColorTexture,et)),Promise.all(r)}},Lh=class{constructor(e){this.parser=e,this.name=Ge.EXT_MATERIALS_BUMP}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:rn}extendMaterialParams(e,t){let n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[],o=s.extensions[this.name];return t.bumpScale=o.bumpFactor!==void 0?o.bumpFactor:1,o.bumpTexture!==void 0&&r.push(n.assignTexture(t,"bumpMap",o.bumpTexture)),Promise.all(r)}},Ph=class{constructor(e){this.parser=e,this.name=Ge.KHR_MATERIALS_ANISOTROPY}getMaterialType(e){let n=this.parser.json.materials[e];return!n.extensions||!n.extensions[this.name]?null:rn}extendMaterialParams(e,t){let n=this.parser,s=n.json.materials[e];if(!s.extensions||!s.extensions[this.name])return Promise.resolve();let r=[],o=s.extensions[this.name];return o.anisotropyStrength!==void 0&&(t.anisotropy=o.anisotropyStrength),o.anisotropyRotation!==void 0&&(t.anisotropyRotation=o.anisotropyRotation),o.anisotropyTexture!==void 0&&r.push(n.assignTexture(t,"anisotropyMap",o.anisotropyTexture)),Promise.all(r)}},Fh=class{constructor(e){this.parser=e,this.name=Ge.KHR_TEXTURE_BASISU}loadTexture(e){let t=this.parser,n=t.json,s=n.textures[e];if(!s.extensions||!s.extensions[this.name])return null;let r=s.extensions[this.name],o=t.options.ktx2Loader;if(!o){if(n.extensionsRequired&&n.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(e,r.source,o)}},Uh=class{constructor(e){this.parser=e,this.name=Ge.EXT_TEXTURE_WEBP,this.isSupported=null}loadTexture(e){let t=this.name,n=this.parser,s=n.json,r=s.textures[e];if(!r.extensions||!r.extensions[t])return null;let o=r.extensions[t],a=s.images[o.source],c=n.textureLoader;if(a.uri){let l=n.options.manager.getHandler(a.uri);l!==null&&(c=l)}return this.detectSupport().then(function(l){if(l)return n.loadTextureImage(e,o.source,c);if(s.extensionsRequired&&s.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: WebP required by asset but unsupported.");return n.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){let t=new Image;t.src="data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}},Nh=class{constructor(e){this.parser=e,this.name=Ge.EXT_TEXTURE_AVIF,this.isSupported=null}loadTexture(e){let t=this.name,n=this.parser,s=n.json,r=s.textures[e];if(!r.extensions||!r.extensions[t])return null;let o=r.extensions[t],a=s.images[o.source],c=n.textureLoader;if(a.uri){let l=n.options.manager.getHandler(a.uri);l!==null&&(c=l)}return this.detectSupport().then(function(l){if(l)return n.loadTextureImage(e,o.source,c);if(s.extensionsRequired&&s.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: AVIF required by asset but unsupported.");return n.loadTexture(e)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(e){let t=new Image;t.src="data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=",t.onload=t.onerror=function(){e(t.height===1)}})),this.isSupported}},Oh=class{constructor(e){this.name=Ge.EXT_MESHOPT_COMPRESSION,this.parser=e}loadBufferView(e){let t=this.parser.json,n=t.bufferViews[e];if(n.extensions&&n.extensions[this.name]){let s=n.extensions[this.name],r=this.parser.getDependency("buffer",s.buffer),o=this.parser.options.meshoptDecoder;if(!o||!o.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return r.then(function(a){let c=s.byteOffset||0,l=s.byteLength||0,h=s.count,u=s.byteStride,d=new Uint8Array(a,c,l);return o.decodeGltfBufferAsync?o.decodeGltfBufferAsync(h,u,d,s.mode,s.filter).then(function(f){return f.buffer}):o.ready.then(function(){let f=new ArrayBuffer(h*u);return o.decodeGltfBuffer(new Uint8Array(f),h,u,d,s.mode,s.filter),f})})}else return null}},Qh=class{constructor(e){this.name=Ge.EXT_MESH_GPU_INSTANCING,this.parser=e}createNodeMesh(e){let t=this.parser.json,n=t.nodes[e];if(!n.extensions||!n.extensions[this.name]||n.mesh===void 0)return null;let s=t.meshes[n.mesh];for(let l of s.primitives)if(l.mode!==Sn.TRIANGLES&&l.mode!==Sn.TRIANGLE_STRIP&&l.mode!==Sn.TRIANGLE_FAN&&l.mode!==void 0)return null;let o=n.extensions[this.name].attributes,a=[],c={};for(let l in o)a.push(this.parser.getDependency("accessor",o[l]).then(h=>(c[l]=h,c[l])));return a.length<1?null:(a.push(this.parser.createNodeMesh(e)),Promise.all(a).then(l=>{let h=l.pop(),u=h.isGroup?h.children:[h],d=l[0].count,f=[];for(let m of u){let g=new Pe,p=new b,A=new jt,I=new b(1,1,1),C=new eo(m.geometry,m.material,d);for(let E=0;E<d;E++)c.TRANSLATION&&p.fromBufferAttribute(c.TRANSLATION,E),c.ROTATION&&A.fromBufferAttribute(c.ROTATION,E),c.SCALE&&I.fromBufferAttribute(c.SCALE,E),C.setMatrixAt(E,g.compose(p,A,I));for(let E in c)if(E==="_COLOR_0"){let w=c[E];C.instanceColor=new Ri(w.array,w.itemSize,w.normalized)}else E!=="TRANSLATION"&&E!=="ROTATION"&&E!=="SCALE"&&m.geometry.setAttribute(E,c[E]);ut.prototype.copy.call(C,m),this.parser.assignFinalMaterial(C),f.push(C)}return h.isGroup?(h.clear(),h.add(...f),h):f[0]}))}},oA="glTF",Io=12,nA={JSON:1313821514,BIN:5130562},kh=class{constructor(e){this.name=Ge.KHR_BINARY_GLTF,this.content=null,this.body=null;let t=new DataView(e,0,Io),n=new TextDecoder;if(this.header={magic:n.decode(new Uint8Array(e.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==oA)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");let s=this.header.length-Io,r=new DataView(e,Io),o=0;for(;o<s;){let a=r.getUint32(o,!0);o+=4;let c=r.getUint32(o,!0);if(o+=4,c===nA.JSON){let l=new Uint8Array(e,Io+o,a);this.content=n.decode(l)}else if(c===nA.BIN){let l=Io+o;this.body=e.slice(l,l+a)}o+=a}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}},Gh=class{constructor(e,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=Ge.KHR_DRACO_MESH_COMPRESSION,this.json=e,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(e,t){let n=this.json,s=this.dracoLoader,r=e.extensions[this.name].bufferView,o=e.extensions[this.name].attributes,a={},c={},l={};for(let h in o){let u=Wh[h]||h.toLowerCase();a[u]=o[h]}for(let h in e.attributes){let u=Wh[h]||h.toLowerCase();if(o[h]!==void 0){let d=n.accessors[e.attributes[h]],f=Cr[d.componentType];l[u]=f.name,c[u]=d.normalized===!0}}return t.getDependency("bufferView",r).then(function(h){return new Promise(function(u,d){s.decodeDracoFile(h,function(f){for(let m in f.attributes){let g=f.attributes[m],p=c[m];p!==void 0&&(g.normalized=p)}u(f)},a,l,yt,d)})})}},Hh=class{constructor(){this.name=Ge.KHR_TEXTURE_TRANSFORM}extendTexture(e,t){return(t.texCoord===void 0||t.texCoord===e.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0||(e=e.clone(),t.texCoord!==void 0&&(e.channel=t.texCoord),t.offset!==void 0&&e.offset.fromArray(t.offset),t.rotation!==void 0&&(e.rotation=t.rotation),t.scale!==void 0&&e.repeat.fromArray(t.scale),e.needsUpdate=!0),e}},Vh=class{constructor(){this.name=Ge.KHR_MESH_QUANTIZATION}},_c=class extends li{constructor(e,t,n,s){super(e,t,n,s)}copySampleValue_(e){let t=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=e*s*3+s;for(let o=0;o!==s;o++)t[o]=n[r+o];return t}interpolate_(e,t,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=a*2,l=a*3,h=s-t,u=(n-t)/h,d=u*u,f=d*u,m=e*l,g=m-l,p=-2*f+3*d,A=f-d,I=1-p,C=A-d+u;for(let E=0;E!==a;E++){let w=o[g+E+a],v=o[g+E+c]*h,T=o[m+E+a],F=o[m+E]*h;r[E]=I*w+C*v+p*T+A*F}return r}},wy=new jt,zh=class extends _c{interpolate_(e,t,n,s){let r=super.interpolate_(e,t,n,s);return wy.fromArray(r).normalize().toArray(r),r}},Sn={FLOAT:5126,FLOAT_MAT3:35675,FLOAT_MAT4:35676,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,LINEAR:9729,REPEAT:10497,SAMPLER_2D:35678,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123},Cr={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},iA={9728:Pt,9729:It,9984:Qa,9985:cr,9986:fs,9987:an},sA={33071:Ln,33648:Zs,10497:bi},Eh={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},Wh={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},Qi={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},by={CUBICSPLINE:void 0,LINEAR:ns,STEP:ts},yh={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function By(i){return i.DefaultMaterial===void 0&&(i.DefaultMaterial=new Cn({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:Fn})),i.DefaultMaterial}function vs(i,e,t){for(let n in t.extensions)i[n]===void 0&&(e.userData.gltfExtensions=e.userData.gltfExtensions||{},e.userData.gltfExtensions[n]=t.extensions[n])}function mi(i,e){e.extras!==void 0&&(typeof e.extras=="object"?Object.assign(i.userData,e.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+e.extras))}function Ry(i,e,t){let n=!1,s=!1,r=!1;for(let l=0,h=e.length;l<h;l++){let u=e[l];if(u.POSITION!==void 0&&(n=!0),u.NORMAL!==void 0&&(s=!0),u.COLOR_0!==void 0&&(r=!0),n&&s&&r)break}if(!n&&!s&&!r)return Promise.resolve(i);let o=[],a=[],c=[];for(let l=0,h=e.length;l<h;l++){let u=e[l];if(n){let d=u.POSITION!==void 0?t.getDependency("accessor",u.POSITION):i.attributes.position;o.push(d)}if(s){let d=u.NORMAL!==void 0?t.getDependency("accessor",u.NORMAL):i.attributes.normal;a.push(d)}if(r){let d=u.COLOR_0!==void 0?t.getDependency("accessor",u.COLOR_0):i.attributes.color;c.push(d)}}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(c)]).then(function(l){let h=l[0],u=l[1],d=l[2];return n&&(i.morphAttributes.position=h),s&&(i.morphAttributes.normal=u),r&&(i.morphAttributes.color=d),i.morphTargetsRelative=!0,i})}function Dy(i,e){if(i.updateMorphTargets(),e.weights!==void 0)for(let t=0,n=e.weights.length;t<n;t++)i.morphTargetInfluences[t]=e.weights[t];if(e.extras&&Array.isArray(e.extras.targetNames)){let t=e.extras.targetNames;if(i.morphTargetInfluences.length===t.length){i.morphTargetDictionary={};for(let n=0,s=t.length;n<s;n++)i.morphTargetDictionary[t[n]]=n}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function Ly(i){let e,t=i.extensions&&i.extensions[Ge.KHR_DRACO_MESH_COMPRESSION];if(t?e="draco:"+t.bufferView+":"+t.indices+":"+xh(t.attributes):e=i.indices+":"+xh(i.attributes)+":"+i.mode,i.targets!==void 0)for(let n=0,s=i.targets.length;n<s;n++)e+=":"+xh(i.targets[n]);return e}function xh(i){let e="",t=Object.keys(i).sort();for(let n=0,s=t.length;n<s;n++)e+=t[n]+":"+i[t[n]]+";";return e}function Kh(i){switch(i){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function Py(i){return i.search(/\.jpe?g($|\?)/i)>0||i.search(/^data\:image\/jpeg/)===0?"image/jpeg":i.search(/\.webp($|\?)/i)>0||i.search(/^data\:image\/webp/)===0?"image/webp":i.search(/\.ktx2($|\?)/i)>0||i.search(/^data\:image\/ktx2/)===0?"image/ktx2":"image/png"}var Fy=new Pe,Xh=class{constructor(e={},t={}){this.json=e,this.extensions={},this.plugins={},this.options=t,this.cache=new Ty,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let n=!1,s=-1,r=!1,o=-1;if(typeof navigator<"u"){let a=navigator.userAgent;n=/^((?!chrome|android).)*safari/i.test(a)===!0;let c=a.match(/Version\/(\d+)/);s=n&&c?parseInt(c[1],10):-1,r=a.indexOf("Firefox")>-1,o=r?a.match(/Firefox\/([0-9]+)\./)[1]:-1}typeof createImageBitmap>"u"||n&&s<17||r&&o<98?this.textureLoader=new as(this.options.manager):this.textureLoader=new po(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new pn(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(e){this.extensions=e}setPlugins(e){this.plugins=e}parse(e,t){let n=this,s=this.json,r=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(o){return o._markDefs&&o._markDefs()}),Promise.all(this._invokeAll(function(o){return o.beforeRoot&&o.beforeRoot()})).then(function(){return Promise.all([n.getDependencies("scene"),n.getDependencies("animation"),n.getDependencies("camera")])}).then(function(o){let a={scene:o[0][s.scene||0],scenes:o[0],animations:o[1],cameras:o[2],asset:s.asset,parser:n,userData:{}};return vs(r,a,s),mi(a,s),Promise.all(n._invokeAll(function(c){return c.afterRoot&&c.afterRoot(a)})).then(function(){for(let c of a.scenes)c.updateMatrixWorld();e(a)})}).catch(t)}_markDefs(){let e=this.json.nodes||[],t=this.json.skins||[],n=this.json.meshes||[];for(let s=0,r=t.length;s<r;s++){let o=t[s].joints;for(let a=0,c=o.length;a<c;a++)e[o[a]].isBone=!0}for(let s=0,r=e.length;s<r;s++){let o=e[s];o.mesh!==void 0&&(this._addNodeRef(this.meshCache,o.mesh),o.skin!==void 0&&(n[o.mesh].isSkinnedMesh=!0)),o.camera!==void 0&&this._addNodeRef(this.cameraCache,o.camera)}}_addNodeRef(e,t){t!==void 0&&(e.refs[t]===void 0&&(e.refs[t]=e.uses[t]=0),e.refs[t]++)}_getNodeRef(e,t,n){if(e.refs[t]<=1)return n;let s=n.clone(),r=(o,a)=>{let c=this.associations.get(o);c!=null&&this.associations.set(a,c);for(let[l,h]of o.children.entries())r(h,a.children[l])};return r(n,s),s.name+="_instance_"+e.uses[t]++,s}_invokeOne(e){let t=Object.values(this.plugins);t.push(this);for(let n=0;n<t.length;n++){let s=e(t[n]);if(s)return s}return null}_invokeAll(e){let t=Object.values(this.plugins);t.unshift(this);let n=[];for(let s=0;s<t.length;s++){let r=e(t[s]);r&&n.push(r)}return n}getDependency(e,t){let n=e+":"+t,s=this.cache.get(n);if(!s){switch(e){case"scene":s=this.loadScene(t);break;case"node":s=this._invokeOne(function(r){return r.loadNode&&r.loadNode(t)});break;case"mesh":s=this._invokeOne(function(r){return r.loadMesh&&r.loadMesh(t)});break;case"accessor":s=this.loadAccessor(t);break;case"bufferView":s=this._invokeOne(function(r){return r.loadBufferView&&r.loadBufferView(t)});break;case"buffer":s=this.loadBuffer(t);break;case"material":s=this._invokeOne(function(r){return r.loadMaterial&&r.loadMaterial(t)});break;case"texture":s=this._invokeOne(function(r){return r.loadTexture&&r.loadTexture(t)});break;case"skin":s=this.loadSkin(t);break;case"animation":s=this._invokeOne(function(r){return r.loadAnimation&&r.loadAnimation(t)});break;case"camera":s=this.loadCamera(t);break;default:if(s=this._invokeOne(function(r){return r!=this&&r.getDependency&&r.getDependency(e,t)}),!s)throw new Error("Unknown type: "+e);break}this.cache.add(n,s)}return s}getDependencies(e){let t=this.cache.get(e);if(!t){let n=this,s=this.json[e+(e==="mesh"?"es":"s")]||[];t=Promise.all(s.map(function(r,o){return n.getDependency(e,o)})),this.cache.add(e,t)}return t}loadBuffer(e){let t=this.json.buffers[e],n=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&e===0)return Promise.resolve(this.extensions[Ge.KHR_BINARY_GLTF].body);let s=this.options;return new Promise(function(r,o){n.load(di.resolveURL(t.uri,s.path),r,void 0,function(){o(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(e){let t=this.json.bufferViews[e];return this.getDependency("buffer",t.buffer).then(function(n){let s=t.byteLength||0,r=t.byteOffset||0;return n.slice(r,r+s)})}loadAccessor(e){let t=this,n=this.json,s=this.json.accessors[e];if(s.bufferView===void 0&&s.sparse===void 0){let o=Eh[s.type],a=Cr[s.componentType],c=s.normalized===!0,l=new a(s.count*o);return Promise.resolve(new pt(l,o,c))}let r=[];return s.bufferView!==void 0?r.push(this.getDependency("bufferView",s.bufferView)):r.push(null),s.sparse!==void 0&&(r.push(this.getDependency("bufferView",s.sparse.indices.bufferView)),r.push(this.getDependency("bufferView",s.sparse.values.bufferView))),Promise.all(r).then(function(o){let a=o[0],c=Eh[s.type],l=Cr[s.componentType],h=l.BYTES_PER_ELEMENT,u=h*c,d=s.byteOffset||0,f=s.bufferView!==void 0?n.bufferViews[s.bufferView].byteStride:void 0,m=s.normalized===!0,g,p;if(f&&f!==u){let A=Math.floor(d/f),I="InterleavedBuffer:"+s.bufferView+":"+s.componentType+":"+A+":"+s.count,C=t.cache.get(I);C||(g=new l(a,A*f,s.count*f/h),C=new tr(g,f/h),t.cache.add(I,C)),p=new nr(C,c,d%f/h,m)}else a===null?g=new l(s.count*c):g=new l(a,d,s.count*c),p=new pt(g,c,m);if(s.sparse!==void 0){let A=Eh.SCALAR,I=Cr[s.sparse.indices.componentType],C=s.sparse.indices.byteOffset||0,E=s.sparse.values.byteOffset||0,w=new I(o[1],C,s.sparse.count*A),v=new l(o[2],E,s.sparse.count*c);a!==null&&(p=new pt(p.array.slice(),p.itemSize,p.normalized)),p.normalized=!1;for(let T=0,F=w.length;T<F;T++){let M=w[T];if(p.setX(M,v[T*c]),c>=2&&p.setY(M,v[T*c+1]),c>=3&&p.setZ(M,v[T*c+2]),c>=4&&p.setW(M,v[T*c+3]),c>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}p.normalized=m}return p})}loadTexture(e){let t=this.json,n=this.options,r=t.textures[e].source,o=t.images[r],a=this.textureLoader;if(o.uri){let c=n.manager.getHandler(o.uri);c!==null&&(a=c)}return this.loadTextureImage(e,r,a)}loadTextureImage(e,t,n){let s=this,r=this.json,o=r.textures[e],a=r.images[t],c=(a.uri||a.bufferView)+":"+o.sampler;if(this.textureCache[c])return this.textureCache[c];let l=this.loadImageSource(t,n).then(function(h){h.flipY=!1,h.name=o.name||a.name||"",h.name===""&&typeof a.uri=="string"&&a.uri.startsWith("data:image/")===!1&&(h.name=a.uri);let d=(r.samplers||{})[o.sampler]||{};return h.magFilter=iA[d.magFilter]||It,h.minFilter=iA[d.minFilter]||an,h.wrapS=sA[d.wrapS]||bi,h.wrapT=sA[d.wrapT]||bi,h.generateMipmaps=!h.isCompressedTexture&&h.minFilter!==Pt&&h.minFilter!==It,s.associations.set(h,{textures:e}),h}).catch(function(){return null});return this.textureCache[c]=l,l}loadImageSource(e,t){let n=this,s=this.json,r=this.options;if(this.sourceCache[e]!==void 0)return this.sourceCache[e].then(u=>u.clone());let o=s.images[e],a=self.URL||self.webkitURL,c=o.uri||"",l=!1;if(o.bufferView!==void 0)c=n.getDependency("bufferView",o.bufferView).then(function(u){l=!0;let d=new Blob([u],{type:o.mimeType});return c=a.createObjectURL(d),c});else if(o.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+e+" is missing URI and bufferView");let h=Promise.resolve(c).then(function(u){return new Promise(function(d,f){let m=d;t.isImageBitmapLoader===!0&&(m=function(g){let p=new St(g);p.needsUpdate=!0,d(p)}),t.load(di.resolveURL(u,r.path),m,void 0,f)})}).then(function(u){return l===!0&&a.revokeObjectURL(c),mi(u,o),u.userData.mimeType=o.mimeType||Py(o.uri),u}).catch(function(u){throw console.error("THREE.GLTFLoader: Couldn't load texture",c),u});return this.sourceCache[e]=h,h}assignTexture(e,t,n,s){let r=this;return this.getDependency("texture",n.index).then(function(o){if(!o)return null;if(n.texCoord!==void 0&&n.texCoord>0&&(o=o.clone(),o.channel=n.texCoord),r.extensions[Ge.KHR_TEXTURE_TRANSFORM]){let a=n.extensions!==void 0?n.extensions[Ge.KHR_TEXTURE_TRANSFORM]:void 0;if(a){let c=r.associations.get(o);o=r.extensions[Ge.KHR_TEXTURE_TRANSFORM].extendTexture(o,a),r.associations.set(o,c)}}return s!==void 0&&(o.colorSpace=s),e[t]=o,o})}assignFinalMaterial(e){let t=e.geometry,n=e.material,s=t.attributes.tangent===void 0,r=t.attributes.color!==void 0,o=t.attributes.normal===void 0;if(e.isPoints){let a="PointsMaterial:"+n.uuid,c=this.cache.get(a);c||(c=new or,$t.prototype.copy.call(c,n),c.color.copy(n.color),c.map=n.map,c.sizeAttenuation=!1,this.cache.add(a,c)),n=c}else if(e.isLine){let a="LineBasicMaterial:"+n.uuid,c=this.cache.get(a);c||(c=new rr,$t.prototype.copy.call(c,n),c.color.copy(n.color),c.map=n.map,this.cache.add(a,c)),n=c}if(s||r||o){let a="ClonedMaterial:"+n.uuid+":";s&&(a+="derivative-tangents:"),r&&(a+="vertex-colors:"),o&&(a+="flat-shading:");let c=this.cache.get(a);c||(c=n.clone(),r&&(c.vertexColors=!0),o&&(c.flatShading=!0),s&&(c.normalScale&&(c.normalScale.y*=-1),c.clearcoatNormalScale&&(c.clearcoatNormalScale.y*=-1)),this.cache.add(a,c),this.associations.set(c,this.associations.get(n))),n=c}e.material=n}getMaterialType(){return Cn}loadMaterial(e){let t=this,n=this.json,s=this.extensions,r=n.materials[e],o,a={},c=r.extensions||{},l=[];if(c[Ge.KHR_MATERIALS_UNLIT]){let u=s[Ge.KHR_MATERIALS_UNLIT];o=u.getMaterialType(),l.push(u.extendParams(a,r,t))}else{let u=r.pbrMetallicRoughness||{};if(a.color=new Ee(1,1,1),a.opacity=1,Array.isArray(u.baseColorFactor)){let d=u.baseColorFactor;a.color.setRGB(d[0],d[1],d[2],yt),a.opacity=d[3]}u.baseColorTexture!==void 0&&l.push(t.assignTexture(a,"map",u.baseColorTexture,et)),a.metalness=u.metallicFactor!==void 0?u.metallicFactor:1,a.roughness=u.roughnessFactor!==void 0?u.roughnessFactor:1,u.metallicRoughnessTexture!==void 0&&(l.push(t.assignTexture(a,"metalnessMap",u.metallicRoughnessTexture)),l.push(t.assignTexture(a,"roughnessMap",u.metallicRoughnessTexture))),o=this._invokeOne(function(d){return d.getMaterialType&&d.getMaterialType(e)}),l.push(Promise.all(this._invokeAll(function(d){return d.extendMaterialParams&&d.extendMaterialParams(e,a)})))}r.doubleSided===!0&&(a.side=Mn);let h=r.alphaMode||yh.OPAQUE;if(h===yh.BLEND?(a.transparent=!0,a.depthWrite=!1):(a.transparent=!1,h===yh.MASK&&(a.alphaTest=r.alphaCutoff!==void 0?r.alphaCutoff:.5)),r.normalTexture!==void 0&&o!==en&&(l.push(t.assignTexture(a,"normalMap",r.normalTexture)),a.normalScale=new ve(1,1),r.normalTexture.scale!==void 0)){let u=r.normalTexture.scale;a.normalScale.set(u,u)}if(r.occlusionTexture!==void 0&&o!==en&&(l.push(t.assignTexture(a,"aoMap",r.occlusionTexture)),r.occlusionTexture.strength!==void 0&&(a.aoMapIntensity=r.occlusionTexture.strength)),r.emissiveFactor!==void 0&&o!==en){let u=r.emissiveFactor;a.emissive=new Ee().setRGB(u[0],u[1],u[2],yt)}return r.emissiveTexture!==void 0&&o!==en&&l.push(t.assignTexture(a,"emissiveMap",r.emissiveTexture,et)),Promise.all(l).then(function(){let u=new o(a);return r.name&&(u.name=r.name),mi(u,r),t.associations.set(u,{materials:e}),r.extensions&&vs(s,u,r),u})}createUniqueName(e){let t=ct.sanitizeNodeName(e||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(e){let t=this,n=this.extensions,s=this.primitiveCache;function r(a){return n[Ge.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(a,t).then(function(c){return rA(c,a,t)})}let o=[];for(let a=0,c=e.length;a<c;a++){let l=e[a],h=Ly(l),u=s[h];if(u)o.push(u.promise);else{let d;l.extensions&&l.extensions[Ge.KHR_DRACO_MESH_COMPRESSION]?d=r(l):d=rA(new Ht,l,t),s[h]={primitive:l,promise:d},o.push(d)}}return Promise.all(o)}loadMesh(e){let t=this,n=this.json,s=this.extensions,r=n.meshes[e],o=r.primitives,a=[];for(let c=0,l=o.length;c<l;c++){let h=o[c].material===void 0?By(this.cache):this.getDependency("material",o[c].material);a.push(h)}return a.push(t.loadGeometries(o)),Promise.all(a).then(function(c){let l=c.slice(0,c.length-1),h=c[c.length-1],u=[];for(let f=0,m=h.length;f<m;f++){let g=h[f],p=o[f],A,I=l[f];if(p.mode===Sn.TRIANGLES||p.mode===Sn.TRIANGLE_STRIP||p.mode===Sn.TRIANGLE_FAN||p.mode===void 0)A=r.isSkinnedMesh===!0?new jr(g,I):new Xe(g,I),A.isSkinnedMesh===!0&&A.normalizeSkinWeights(),p.mode===Sn.TRIANGLE_STRIP?A.geometry=_h(A.geometry,yo):p.mode===Sn.TRIANGLE_FAN&&(A.geometry=_h(A.geometry,mr));else if(p.mode===Sn.LINES)A=new to(g,I);else if(p.mode===Sn.LINE_STRIP)A=new os(g,I);else if(p.mode===Sn.LINE_LOOP)A=new no(g,I);else if(p.mode===Sn.POINTS)A=new io(g,I);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+p.mode);Object.keys(A.geometry.morphAttributes).length>0&&Dy(A,r),A.name=t.createUniqueName(r.name||"mesh_"+e),mi(A,r),p.extensions&&vs(s,A,p),t.assignFinalMaterial(A),u.push(A)}for(let f=0,m=u.length;f<m;f++)t.associations.set(u[f],{meshes:e,primitives:f});if(u.length===1)return r.extensions&&vs(s,u[0],r),u[0];let d=new fn;r.extensions&&vs(s,d,r),t.associations.set(d,{meshes:e});for(let f=0,m=u.length;f<m;f++)d.add(u[f]);return d})}loadCamera(e){let t,n=this.json.cameras[e],s=n[n.type];if(!s){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return n.type==="perspective"?t=new Mt(xo.radToDeg(s.yfov),s.aspectRatio||1,s.znear||1,s.zfar||2e6):n.type==="orthographic"&&(t=new hs(-s.xmag,s.xmag,s.ymag,-s.ymag,s.znear,s.zfar)),n.name&&(t.name=this.createUniqueName(n.name)),mi(t,n),Promise.resolve(t)}loadSkin(e){let t=this.json.skins[e],n=[];for(let s=0,r=t.joints.length;s<r;s++)n.push(this._loadNodeShallow(t.joints[s]));return t.inverseBindMatrices!==void 0?n.push(this.getDependency("accessor",t.inverseBindMatrices)):n.push(null),Promise.all(n).then(function(s){let r=s.pop(),o=s,a=[],c=[];for(let l=0,h=o.length;l<h;l++){let u=o[l];if(u){a.push(u);let d=new Pe;r!==null&&d.fromArray(r.array,l*16),c.push(d)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[l])}return new $r(a,c)})}loadAnimation(e){let t=this.json,n=this,s=t.animations[e],r=s.name?s.name:"animation_"+e,o=[],a=[],c=[],l=[],h=[];for(let u=0,d=s.channels.length;u<d;u++){let f=s.channels[u],m=s.samplers[f.sampler],g=f.target,p=g.node,A=s.parameters!==void 0?s.parameters[m.input]:m.input,I=s.parameters!==void 0?s.parameters[m.output]:m.output;g.node!==void 0&&(o.push(this.getDependency("node",p)),a.push(this.getDependency("accessor",A)),c.push(this.getDependency("accessor",I)),l.push(m),h.push(g))}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(c),Promise.all(l),Promise.all(h)]).then(function(u){let d=u[0],f=u[1],m=u[2],g=u[3],p=u[4],A=[];for(let I=0,C=d.length;I<C;I++){let E=d[I],w=f[I],v=m[I],T=g[I],F=p[I];if(E===void 0)continue;E.updateMatrix&&E.updateMatrix();let M=n._createAnimationTracks(E,w,v,T,F);if(M)for(let x=0;x<M.length;x++)A.push(M[x])}return new ho(r,void 0,A)})}createNodeMesh(e){let t=this.json,n=this,s=t.nodes[e];return s.mesh===void 0?null:n.getDependency("mesh",s.mesh).then(function(r){let o=n._getNodeRef(n.meshCache,s.mesh,r);return s.weights!==void 0&&o.traverse(function(a){if(a.isMesh)for(let c=0,l=s.weights.length;c<l;c++)a.morphTargetInfluences[c]=s.weights[c]}),o})}loadNode(e){let t=this.json,n=this,s=t.nodes[e],r=n._loadNodeShallow(e),o=[],a=s.children||[];for(let l=0,h=a.length;l<h;l++)o.push(n.getDependency("node",a[l]));let c=s.skin===void 0?Promise.resolve(null):n.getDependency("skin",s.skin);return Promise.all([r,Promise.all(o),c]).then(function(l){let h=l[0],u=l[1],d=l[2];d!==null&&h.traverse(function(f){f.isSkinnedMesh&&f.bind(d,Fy)});for(let f=0,m=u.length;f<m;f++)h.add(u[f]);return h})}_loadNodeShallow(e){let t=this.json,n=this.extensions,s=this;if(this.nodeCache[e]!==void 0)return this.nodeCache[e];let r=t.nodes[e],o=r.name?s.createUniqueName(r.name):"",a=[],c=s._invokeOne(function(l){return l.createNodeMesh&&l.createNodeMesh(e)});return c&&a.push(c),r.camera!==void 0&&a.push(s.getDependency("camera",r.camera).then(function(l){return s._getNodeRef(s.cameraCache,r.camera,l)})),s._invokeAll(function(l){return l.createNodeAttachment&&l.createNodeAttachment(e)}).forEach(function(l){a.push(l)}),this.nodeCache[e]=Promise.all(a).then(function(l){let h;if(r.isBone===!0?h=new ir:l.length>1?h=new fn:l.length===1?h=l[0]:h=new ut,h!==l[0])for(let u=0,d=l.length;u<d;u++)h.add(l[u]);if(r.name&&(h.userData.name=r.name,h.name=o),mi(h,r),r.extensions&&vs(n,h,r),r.matrix!==void 0){let u=new Pe;u.fromArray(r.matrix),h.applyMatrix4(u)}else r.translation!==void 0&&h.position.fromArray(r.translation),r.rotation!==void 0&&h.quaternion.fromArray(r.rotation),r.scale!==void 0&&h.scale.fromArray(r.scale);return s.associations.has(h)||s.associations.set(h,{}),s.associations.get(h).nodes=e,h}),this.nodeCache[e]}loadScene(e){let t=this.extensions,n=this.json.scenes[e],s=this,r=new fn;n.name&&(r.name=s.createUniqueName(n.name)),mi(r,n),n.extensions&&vs(t,r,n);let o=n.nodes||[],a=[];for(let c=0,l=o.length;c<l;c++)a.push(s.getDependency("node",o[c]));return Promise.all(a).then(function(c){for(let h=0,u=c.length;h<u;h++)r.add(c[h]);let l=h=>{let u=new Map;for(let[d,f]of s.associations)(d instanceof $t||d instanceof St)&&u.set(d,f);return h.traverse(d=>{let f=s.associations.get(d);f!=null&&u.set(d,f)}),u};return s.associations=l(r),r})}_createAnimationTracks(e,t,n,s,r){let o=[],a=e.name?e.name:e.uuid,c=[];Qi[r.path]===Qi.weights?e.traverse(function(d){d.morphTargetInfluences&&c.push(d.name?d.name:d.uuid)}):c.push(a);let l;switch(Qi[r.path]){case Qi.weights:l=Vn;break;case Qi.rotation:l=zn;break;case Qi.position:case Qi.scale:l=Wn;break;default:switch(n.itemSize){case 1:l=Vn;break;case 2:case 3:default:l=Wn;break}break}let h=s.interpolation!==void 0?by[s.interpolation]:ns,u=this._getArrayFromAccessor(n);for(let d=0,f=c.length;d<f;d++){let m=new l(c[d]+"."+Qi[r.path],t.array,u,h);s.interpolation==="CUBICSPLINE"&&this._createCubicSplineTrackInterpolant(m),o.push(m)}return o}_getArrayFromAccessor(e){let t=e.array;if(e.normalized){let n=Kh(t.constructor),s=new Float32Array(t.length);for(let r=0,o=t.length;r<o;r++)s[r]=t[r]*n;t=s}return t}_createCubicSplineTrackInterpolant(e){e.createInterpolant=function(n){let s=this instanceof zn?zh:_c;return new s(this.times,this.values,this.getValueSize()/3,n)},e.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0}};function Uy(i,e,t){let n=e.attributes,s=new Ft;if(n.POSITION!==void 0){let a=t.json.accessors[n.POSITION],c=a.min,l=a.max;if(c!==void 0&&l!==void 0){if(s.set(new b(c[0],c[1],c[2]),new b(l[0],l[1],l[2])),a.normalized){let h=Kh(Cr[a.componentType]);s.min.multiplyScalar(h),s.max.multiplyScalar(h)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;let r=e.targets;if(r!==void 0){let a=new b,c=new b;for(let l=0,h=r.length;l<h;l++){let u=r[l];if(u.POSITION!==void 0){let d=t.json.accessors[u.POSITION],f=d.min,m=d.max;if(f!==void 0&&m!==void 0){if(c.setX(Math.max(Math.abs(f[0]),Math.abs(m[0]))),c.setY(Math.max(Math.abs(f[1]),Math.abs(m[1]))),c.setZ(Math.max(Math.abs(f[2]),Math.abs(m[2]))),d.normalized){let g=Kh(Cr[d.componentType]);c.multiplyScalar(g)}a.max(c)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}s.expandByVector(a)}i.boundingBox=s;let o=new sn;s.getCenter(o.center),o.radius=s.min.distanceTo(s.max)/2,i.boundingSphere=o}function rA(i,e,t){let n=e.attributes,s=[];function r(o,a){return t.getDependency("accessor",o).then(function(c){i.setAttribute(a,c)})}for(let o in n){let a=Wh[o]||o.toLowerCase();a in i.attributes||s.push(r(n[o],a))}if(e.indices!==void 0&&!i.index){let o=t.getDependency("accessor",e.indices).then(function(a){i.setIndex(a)});s.push(o)}return Qe.workingColorSpace!==yt&&"COLOR_0"in n&&console.warn(`THREE.GLTFLoader: Converting vertex colors from "srgb-linear" to "${Qe.workingColorSpace}" not supported.`),mi(i,e),Uy(i,e,t),Promise.all(s).then(function(){return e.targets!==void 0?Ry(i,e.targets,t):i})}var qh=new WeakMap,Ec=class extends on{constructor(e){super(e),this.decoderPath="",this.decoderConfig={},this.decoderBinary=null,this.decoderPending=null,this.workerLimit=4,this.workerPool=[],this.workerNextTaskID=1,this.workerSourceURL="",this.defaultAttributeIDs={position:"POSITION",normal:"NORMAL",color:"COLOR",uv:"TEX_COORD"},this.defaultAttributeTypes={position:"Float32Array",normal:"Float32Array",color:"Float32Array",uv:"Float32Array"}}setDecoderPath(e){return this.decoderPath=e,this}setDecoderConfig(e){return this.decoderConfig=e,this}setWorkerLimit(e){return this.workerLimit=e,this}load(e,t,n,s){let r=new pn(this.manager);r.setPath(this.path),r.setResponseType("arraybuffer"),r.setRequestHeader(this.requestHeader),r.setWithCredentials(this.withCredentials),r.load(e,o=>{this.parse(o,t,s)},n,s)}parse(e,t,n=()=>{}){this.decodeDracoFile(e,t,null,null,et,n).catch(n)}decodeDracoFile(e,t,n,s,r=yt,o=()=>{}){let a={attributeIDs:n||this.defaultAttributeIDs,attributeTypes:s||this.defaultAttributeTypes,useUniqueIDs:!!n,vertexColorSpace:r};return this.decodeGeometry(e,a).then(t).catch(o)}decodeGeometry(e,t){let n=JSON.stringify(t);if(qh.has(e)){let c=qh.get(e);if(c.key===n)return c.promise;if(e.byteLength===0)throw new Error("THREE.DRACOLoader: Unable to re-decode a buffer with different settings. Buffer has already been transferred.")}let s,r=this.workerNextTaskID++,o=e.byteLength,a=this._getWorker(r,o).then(c=>(s=c,new Promise((l,h)=>{s._callbacks[r]={resolve:l,reject:h},s.postMessage({type:"decode",id:r,taskConfig:t,buffer:e},[e])}))).then(c=>this._createGeometry(c.geometry));return a.catch(()=>!0).then(()=>{s&&r&&this._releaseTask(s,r)}),qh.set(e,{key:n,promise:a}),a}_createGeometry(e){let t=new Ht;e.index&&t.setIndex(new pt(e.index.array,1));for(let n=0;n<e.attributes.length;n++){let s=e.attributes[n],r=s.name,o=s.array,a=s.itemSize,c=new pt(o,a);r==="color"&&(this._assignVertexColorSpace(c,s.vertexColorSpace),c.normalized=!(o instanceof Float32Array)),t.setAttribute(r,c)}return t}_assignVertexColorSpace(e,t){if(t!==et)return;let n=new Ee;for(let s=0,r=e.count;s<r;s++)n.fromBufferAttribute(e,s),Qe.toWorkingColorSpace(n,et),e.setXYZ(s,n.r,n.g,n.b)}_loadLibrary(e,t){let n=new pn(this.manager);return n.setPath(this.decoderPath),n.setResponseType(t),n.setWithCredentials(this.withCredentials),new Promise((s,r)=>{n.load(e,s,void 0,r)})}preload(){return this._initDecoder(),this}_initDecoder(){if(this.decoderPending)return this.decoderPending;let e=typeof WebAssembly!="object"||this.decoderConfig.type==="js",t=[];return e?t.push(this._loadLibrary("draco_decoder.js","text")):(t.push(this._loadLibrary("draco_wasm_wrapper.js","text")),t.push(this._loadLibrary("draco_decoder.wasm","arraybuffer"))),this.decoderPending=Promise.all(t).then(n=>{let s=n[0];e||(this.decoderConfig.wasmBinary=n[1]);let r=Ny.toString(),o=["/* draco decoder */",s,"","/* worker */",r.substring(r.indexOf("{")+1,r.lastIndexOf("}"))].join(`
`);this.workerSourceURL=URL.createObjectURL(new Blob([o]))}),this.decoderPending}_getWorker(e,t){return this._initDecoder().then(()=>{if(this.workerPool.length<this.workerLimit){let s=new Worker(this.workerSourceURL);s._callbacks={},s._taskCosts={},s._taskLoad=0,s.postMessage({type:"init",decoderConfig:this.decoderConfig}),s.onmessage=function(r){let o=r.data;switch(o.type){case"decode":s._callbacks[o.id].resolve(o);break;case"error":s._callbacks[o.id].reject(o);break;default:console.error('THREE.DRACOLoader: Unexpected message, "'+o.type+'"')}},this.workerPool.push(s)}else this.workerPool.sort(function(s,r){return s._taskLoad>r._taskLoad?-1:1});let n=this.workerPool[this.workerPool.length-1];return n._taskCosts[e]=t,n._taskLoad+=t,n})}_releaseTask(e,t){e._taskLoad-=e._taskCosts[t],delete e._callbacks[t],delete e._taskCosts[t]}debug(){console.log("Task load: ",this.workerPool.map(e=>e._taskLoad))}dispose(){for(let e=0;e<this.workerPool.length;++e)this.workerPool[e].terminate();return this.workerPool.length=0,this.workerSourceURL!==""&&URL.revokeObjectURL(this.workerSourceURL),this}};function Ny(){let i,e;onmessage=function(o){let a=o.data;switch(a.type){case"init":i=a.decoderConfig,e=new Promise(function(h){i.onModuleLoaded=function(u){h({draco:u})},DracoDecoderModule(i)});break;case"decode":let c=a.buffer,l=a.taskConfig;e.then(h=>{let u=h.draco,d=new u.Decoder;try{let f=t(u,d,new Int8Array(c),l),m=f.attributes.map(g=>g.array.buffer);f.index&&m.push(f.index.array.buffer),self.postMessage({type:"decode",id:a.id,geometry:f},m)}catch(f){console.error(f),self.postMessage({type:"error",id:a.id,error:f.message})}finally{u.destroy(d)}});break}};function t(o,a,c,l){let h=l.attributeIDs,u=l.attributeTypes,d,f,m=a.GetEncodedGeometryType(c);if(m===o.TRIANGULAR_MESH)d=new o.Mesh,f=a.DecodeArrayToMesh(c,c.byteLength,d);else if(m===o.POINT_CLOUD)d=new o.PointCloud,f=a.DecodeArrayToPointCloud(c,c.byteLength,d);else throw new Error("THREE.DRACOLoader: Unexpected geometry type.");if(!f.ok()||d.ptr===0)throw new Error("THREE.DRACOLoader: Decoding failed: "+f.error_msg());let g={index:null,attributes:[]};for(let p in h){let A=self[u[p]],I,C;if(l.useUniqueIDs)C=h[p],I=a.GetAttributeByUniqueId(d,C);else{if(C=a.GetAttributeId(d,o[h[p]]),C===-1)continue;I=a.GetAttribute(d,C)}let E=s(o,a,d,p,A,I);p==="color"&&(E.vertexColorSpace=l.vertexColorSpace),g.attributes.push(E)}return m===o.TRIANGULAR_MESH&&(g.index=n(o,a,d)),o.destroy(d),g}function n(o,a,c){let h=c.num_faces()*3,u=h*4,d=o._malloc(u);a.GetTrianglesUInt32Array(c,u,d);let f=new Uint32Array(o.HEAPF32.buffer,d,h).slice();return o._free(d),{array:f,itemSize:1}}function s(o,a,c,l,h,u){let d=u.num_components(),m=c.num_points()*d,g=m*h.BYTES_PER_ELEMENT,p=r(o,h),A=o._malloc(g);a.GetAttributeDataArrayForAllPoints(c,u,p,g,A);let I=new h(o.HEAPF32.buffer,A,m).slice();return o._free(A),{name:l,array:I,itemSize:d}}function r(o,a){switch(a){case Float32Array:return o.DT_FLOAT32;case Int8Array:return o.DT_INT8;case Int16Array:return o.DT_INT16;case Int32Array:return o.DT_INT32;case Uint8Array:return o.DT_UINT8;case Uint16Array:return o.DT_UINT16;case Uint32Array:return o.DT_UINT32}}}var yc=class{constructor(e=4){this.pool=e,this.queue=[],this.workers=[],this.workersResolve=[],this.workerStatus=0}_initWorker(e){if(!this.workers[e]){let t=this.workerCreator();t.addEventListener("message",this._onMessage.bind(this,e)),this.workers[e]=t}}_getIdleWorker(){for(let e=0;e<this.pool;e++)if(!(this.workerStatus&1<<e))return e;return-1}_onMessage(e,t){let n=this.workersResolve[e];if(n&&n(t),this.queue.length){let{resolve:s,msg:r,transfer:o}=this.queue.shift();this.workersResolve[e]=s,this.workers[e].postMessage(r,o)}else this.workerStatus^=1<<e}setWorkerCreator(e){this.workerCreator=e}setWorkerLimit(e){this.pool=e}postMessage(e,t){return new Promise(n=>{let s=this._getIdleWorker();s!==-1?(this._initWorker(s),this.workerStatus|=1<<s,this.workersResolve[s]=n,this.workers[s].postMessage(e,t)):this.queue.push({resolve:n,msg:e,transfer:t})})}dispose(){this.workers.forEach(e=>e.terminate()),this.workersResolve.length=0,this.workers.length=0,this.queue.length=0,this.workerStatus=0}};var Yh=class{constructor(){this.vkFormat=0,this.typeSize=1,this.pixelWidth=0,this.pixelHeight=0,this.pixelDepth=0,this.layerCount=0,this.faceCount=1,this.supercompressionScheme=0,this.levels=[],this.dataFormatDescriptor=[{vendorId:0,descriptorType:0,descriptorBlockSize:0,versionNumber:2,colorModel:0,colorPrimaries:1,transferFunction:2,flags:0,texelBlockDimension:[0,0,0,0],bytesPlane:[0,0,0,0,0,0,0,0],samples:[]}],this.keyValue={},this.globalData=null}},Ts=class{constructor(e,t,n,s){this._dataView=void 0,this._littleEndian=void 0,this._offset=void 0,this._dataView=new DataView(e.buffer,e.byteOffset+t,n),this._littleEndian=s,this._offset=0}_nextUint8(){let e=this._dataView.getUint8(this._offset);return this._offset+=1,e}_nextUint16(){let e=this._dataView.getUint16(this._offset,this._littleEndian);return this._offset+=2,e}_nextUint32(){let e=this._dataView.getUint32(this._offset,this._littleEndian);return this._offset+=4,e}_nextUint64(){let e=this._dataView.getUint32(this._offset,this._littleEndian)+4294967296*this._dataView.getUint32(this._offset+4,this._littleEndian);return this._offset+=8,e}_nextInt32(){let e=this._dataView.getInt32(this._offset,this._littleEndian);return this._offset+=4,e}_nextUint8Array(e){let t=new Uint8Array(this._dataView.buffer,this._dataView.byteOffset+this._offset,e);return this._offset+=e,t}_skip(e){return this._offset+=e,this}_scan(e,t){t===void 0&&(t=0);let n=this._offset,s=0;for(;this._dataView.getUint8(this._offset)!==t&&s<e;)s++,this._offset++;return s<e&&this._offset++,new Uint8Array(this._dataView.buffer,this._dataView.byteOffset+n,s)}},US=new Uint8Array([0]),tn=[171,75,84,88,32,50,48,187,13,10,26,10];function aA(i){return new TextDecoder().decode(i)}function cA(i){let e=new Uint8Array(i.buffer,i.byteOffset,tn.length);if(e[0]!==tn[0]||e[1]!==tn[1]||e[2]!==tn[2]||e[3]!==tn[3]||e[4]!==tn[4]||e[5]!==tn[5]||e[6]!==tn[6]||e[7]!==tn[7]||e[8]!==tn[8]||e[9]!==tn[9]||e[10]!==tn[10]||e[11]!==tn[11])throw new Error("Missing KTX 2.0 identifier.");let t=new Yh,n=17*Uint32Array.BYTES_PER_ELEMENT,s=new Ts(i,tn.length,n,!0);t.vkFormat=s._nextUint32(),t.typeSize=s._nextUint32(),t.pixelWidth=s._nextUint32(),t.pixelHeight=s._nextUint32(),t.pixelDepth=s._nextUint32(),t.layerCount=s._nextUint32(),t.faceCount=s._nextUint32();let r=s._nextUint32();t.supercompressionScheme=s._nextUint32();let o=s._nextUint32(),a=s._nextUint32(),c=s._nextUint32(),l=s._nextUint32(),h=s._nextUint64(),u=s._nextUint64(),d=new Ts(i,tn.length+n,3*r*8,!0);for(let J=0;J<r;J++)t.levels.push({levelData:new Uint8Array(i.buffer,i.byteOffset+d._nextUint64(),d._nextUint64()),uncompressedByteLength:d._nextUint64()});let f=new Ts(i,o,a,!0),m={vendorId:f._skip(4)._nextUint16(),descriptorType:f._nextUint16(),versionNumber:f._nextUint16(),descriptorBlockSize:f._nextUint16(),colorModel:f._nextUint8(),colorPrimaries:f._nextUint8(),transferFunction:f._nextUint8(),flags:f._nextUint8(),texelBlockDimension:[f._nextUint8(),f._nextUint8(),f._nextUint8(),f._nextUint8()],bytesPlane:[f._nextUint8(),f._nextUint8(),f._nextUint8(),f._nextUint8(),f._nextUint8(),f._nextUint8(),f._nextUint8(),f._nextUint8()],samples:[]},g=(m.descriptorBlockSize/4-6)/4;for(let J=0;J<g;J++){let k={bitOffset:f._nextUint16(),bitLength:f._nextUint8(),channelType:f._nextUint8(),samplePosition:[f._nextUint8(),f._nextUint8(),f._nextUint8(),f._nextUint8()],sampleLower:-1/0,sampleUpper:1/0};64&k.channelType?(k.sampleLower=f._nextInt32(),k.sampleUpper=f._nextInt32()):(k.sampleLower=f._nextUint32(),k.sampleUpper=f._nextUint32()),m.samples[J]=k}t.dataFormatDescriptor.length=0,t.dataFormatDescriptor.push(m);let p=new Ts(i,c,l,!0);for(;p._offset<l;){let J=p._nextUint32(),k=p._scan(J),te=aA(k);if(t.keyValue[te]=p._nextUint8Array(J-k.byteLength-1),te.match(/^ktx/i)){let le=aA(t.keyValue[te]);t.keyValue[te]=le.substring(0,le.lastIndexOf("\0"))}p._skip(J%4?4-J%4:0)}if(u<=0)return t;let A=new Ts(i,h,u,!0),I=A._nextUint16(),C=A._nextUint16(),E=A._nextUint32(),w=A._nextUint32(),v=A._nextUint32(),T=A._nextUint32(),F=[];for(let J=0;J<r;J++)F.push({imageFlags:A._nextUint32(),rgbSliceByteOffset:A._nextUint32(),rgbSliceByteLength:A._nextUint32(),alphaSliceByteOffset:A._nextUint32(),alphaSliceByteLength:A._nextUint32()});let M=h+A._offset,x=M+E,R=x+w,G=R+v,N=new Uint8Array(i.buffer,i.byteOffset+M,E),H=new Uint8Array(i.buffer,i.byteOffset+x,w),Y=new Uint8Array(i.buffer,i.byteOffset+R,v),z=new Uint8Array(i.buffer,i.byteOffset+G,T);return t.globalData={endpointCount:I,selectorCount:C,imageDescs:F,endpointsData:N,selectorsData:H,tablesData:Y,extendedData:z},t}var Jh,gi,jh,Zh={env:{emscripten_notify_memory_growth:function(i){jh=new Uint8Array(gi.exports.memory.buffer)}}},xc=class{init(){return Jh||(Jh=typeof fetch<"u"?fetch("data:application/wasm;base64,"+lA).then(e=>e.arrayBuffer()).then(e=>WebAssembly.instantiate(e,Zh)).then(this._init):WebAssembly.instantiate(Buffer.from(lA,"base64"),Zh).then(this._init),Jh)}_init(e){gi=e.instance,Zh.env.emscripten_notify_memory_growth(0)}decode(e,t=0){if(!gi)throw new Error("ZSTDDecoder: Await .init() before decoding.");let n=e.byteLength,s=gi.exports.malloc(n);jh.set(e,s),t=t||Number(gi.exports.ZSTD_findDecompressedSize(s,n));let r=gi.exports.malloc(t),o=gi.exports.ZSTD_decompress(r,t,s,n),a=jh.slice(r,r+o);return gi.exports.free(s),gi.exports.free(r),a}},lA="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IAMNACAEQQNxBEADQCACRQ0FIAAgAkF/aiICaiIDIAEgAmotAAA6AAAgA0EDcQ0ACwsgAkEDTQ0AA0AgACACQXxqIgJqIAEgAmooAgA2AgAgAkEDSw0ACwsgAkUNAgNAIAAgAkF/aiICaiABIAJqLQAAOgAAIAINAAsMAgsgAkEDTQ0AIAIhBANAIAMgASgCADYCACABQQRqIQEgA0EEaiEDIARBfGoiBEEDSw0ACyACQQNxIQILIAJFDQADQCADIAEtAAA6AAAgA0EBaiEDIAFBAWohASACQX9qIgINAAsLIAAL8wICAn8BfgJAIAJFDQAgACACaiIDQX9qIAE6AAAgACABOgAAIAJBA0kNACADQX5qIAE6AAAgACABOgABIANBfWogAToAACAAIAE6AAIgAkEHSQ0AIANBfGogAToAACAAIAE6AAMgAkEJSQ0AIABBACAAa0EDcSIEaiIDIAFB/wFxQYGChAhsIgE2AgAgAyACIARrQXxxIgRqIgJBfGogATYCACAEQQlJDQAgAyABNgIIIAMgATYCBCACQXhqIAE2AgAgAkF0aiABNgIAIARBGUkNACADIAE2AhggAyABNgIUIAMgATYCECADIAE2AgwgAkFwaiABNgIAIAJBbGogATYCACACQWhqIAE2AgAgAkFkaiABNgIAIAQgA0EEcUEYciIEayICQSBJDQAgAa0iBUIghiAFhCEFIAMgBGohAQNAIAEgBTcDGCABIAU3AxAgASAFNwMIIAEgBTcDACABQSBqIQEgAkFgaiICQR9LDQALCyAACy8BAn8gACgCBCAAKAIAQQJ0aiICLQACIQMgACACLwEAIAEgAi0AAxAIajYCACADCy8BAn8gACgCBCAAKAIAQQJ0aiICLQACIQMgACACLwEAIAEgAi0AAxAFajYCACADCx8AIAAgASACKAIEEAg2AgAgARAEGiAAIAJBCGo2AgQLCAAgAGdBH3MLugUBDX8jAEEQayIKJAACfyAEQQNNBEAgCkEANgIMIApBDGogAyAEEAsaIAAgASACIApBDGpBBBAVIgBBbCAAEAMbIAAgACAESxsMAQsgAEEAIAEoAgBBAXRBAmoQECENQVQgAygAACIGQQ9xIgBBCksNABogAiAAQQVqNgIAIAMgBGoiAkF8aiEMIAJBeWohDiACQXtqIRAgAEEGaiELQQQhBSAGQQR2IQRBICAAdCIAQQFyIQkgASgCACEPQQAhAiADIQYCQANAIAlBAkggAiAPS3JFBEAgAiEHAkAgCARAA0AgBEH//wNxQf//A0YEQCAHQRhqIQcgBiAQSQR/IAZBAmoiBigAACAFdgUgBUEQaiEFIARBEHYLIQQMAQsLA0AgBEEDcSIIQQNGBEAgBUECaiEFIARBAnYhBCAHQQNqIQcMAQsLIAcgCGoiByAPSw0EIAVBAmohBQNAIAIgB0kEQCANIAJBAXRqQQA7AQAgAkEBaiECDAELCyAGIA5LQQAgBiAFQQN1aiIHIAxLG0UEQCAHKAAAIAVBB3EiBXYhBAwCCyAEQQJ2IQQLIAYhBwsCfyALQX9qIAQgAEF/anEiBiAAQQF0QX9qIgggCWsiEUkNABogBCAIcSIEQQAgESAEIABIG2shBiALCyEIIA0gAkEBdGogBkF/aiIEOwEAIAlBASAGayAEIAZBAUgbayEJA0AgCSAASARAIABBAXUhACALQX9qIQsMAQsLAn8gByAOS0EAIAcgBSAIaiIFQQN1aiIGIAxLG0UEQCAFQQdxDAELIAUgDCIGIAdrQQN0awshBSACQQFqIQIgBEUhCCAGKAAAIAVBH3F2IQQMAQsLQWwgCUEBRyAFQSBKcg0BGiABIAJBf2o2AgAgBiAFQQdqQQN1aiADawwBC0FQCyEAIApBEGokACAACwkAQQFBBSAAGwsMACAAIAEoAAA2AAALqgMBCn8jAEHwAGsiCiQAIAJBAWohDiAAQQhqIQtBgIAEIAVBf2p0QRB1IQxBACECQQEhBkEBIAV0IglBf2oiDyEIA0AgAiAORkUEQAJAIAEgAkEBdCINai8BACIHQf//A0YEQCALIAhBA3RqIAI2AgQgCEF/aiEIQQEhBwwBCyAGQQAgDCAHQRB0QRB1ShshBgsgCiANaiAHOwEAIAJBAWohAgwBCwsgACAFNgIEIAAgBjYCACAJQQN2IAlBAXZqQQNqIQxBACEAQQAhBkEAIQIDQCAGIA5GBEADQAJAIAAgCUYNACAKIAsgAEEDdGoiASgCBCIGQQF0aiICIAIvAQAiAkEBajsBACABIAUgAhAUayIIOgADIAEgAiAIQf8BcXQgCWs7AQAgASAEIAZBAnQiAmooAgA6AAIgASACIANqKAIANgIEIABBAWohAAwBCwsFIAEgBkEBdGouAQAhDUEAIQcDQCAHIA1ORQRAIAsgAkEDdGogBjYCBANAIAIgDGogD3EiAiAISw0ACyAHQQFqIQcMAQsLIAZBAWohBgwBCwsgCkHwAGokAAsjAEIAIAEQCSAAhUKHla+vmLbem55/fkLj3MqV/M7y9YV/fAsQACAAQn43AwggACABNgIACyQBAX8gAARAIAEoAgQiAgRAIAEoAgggACACEQEADwsgABAmCwsfACAAIAEgAi8BABAINgIAIAEQBBogACACQQRqNgIEC0oBAX9BoCAoAgAiASAAaiIAQX9MBEBBiCBBMDYCAEF/DwsCQCAAPwBBEHRNDQAgABBmDQBBiCBBMDYCAEF/DwtBoCAgADYCACABC9cBAQh/Qbp/IQoCQCACKAIEIgggAigCACIJaiIOIAEgAGtLDQBBbCEKIAkgBCADKAIAIgtrSw0AIAAgCWoiBCACKAIIIgxrIQ0gACABQWBqIg8gCyAJQQAQKSADIAkgC2o2AgACQAJAIAwgBCAFa00EQCANIQUMAQsgDCAEIAZrSw0CIAcgDSAFayIAaiIBIAhqIAdNBEAgBCABIAgQDxoMAgsgBCABQQAgAGsQDyEBIAIgACAIaiIINgIEIAEgAGshBAsgBCAPIAUgCEEBECkLIA4hCgsgCgubAgEBfyMAQYABayINJAAgDSADNgJ8AkAgAkEDSwRAQX8hCQwBCwJAAkACQAJAIAJBAWsOAwADAgELIAZFBEBBuH8hCQwEC0FsIQkgBS0AACICIANLDQMgACAHIAJBAnQiAmooAgAgAiAIaigCABA7IAEgADYCAEEBIQkMAwsgASAJNgIAQQAhCQwCCyAKRQRAQWwhCQwCC0EAIQkgC0UgDEEZSHINAUEIIAR0QQhqIQBBACECA0AgAiAATw0CIAJBQGshAgwAAAsAC0FsIQkgDSANQfwAaiANQfgAaiAFIAYQFSICEAMNACANKAJ4IgMgBEsNACAAIA0gDSgCfCAHIAggAxAYIAEgADYCACACIQkLIA1BgAFqJAAgCQsLACAAIAEgAhALGgsQACAALwAAIAAtAAJBEHRyCy8AAn9BuH8gAUEISQ0AGkFyIAAoAAQiAEF3Sw0AGkG4fyAAQQhqIgAgACABSxsLCwkAIAAgATsAAAsDAAELigYBBX8gACAAKAIAIgVBfnE2AgBBACAAIAVBAXZqQYQgKAIAIgQgAEYbIQECQAJAIAAoAgQiAkUNACACKAIAIgNBAXENACACQQhqIgUgA0EBdkF4aiIDQQggA0EISxtnQR9zQQJ0QYAfaiIDKAIARgRAIAMgAigCDDYCAAsgAigCCCIDBEAgAyACKAIMNgIECyACKAIMIgMEQCADIAIoAgg2AgALIAIgAigCACAAKAIAQX5xajYCAEGEICEAAkACQCABRQ0AIAEgAjYCBCABKAIAIgNBAXENASADQQF2QXhqIgNBCCADQQhLG2dBH3NBAnRBgB9qIgMoAgAgAUEIakYEQCADIAEoAgw2AgALIAEoAggiAwRAIAMgASgCDDYCBAsgASgCDCIDBEAgAyABKAIINgIAQYQgKAIAIQQLIAIgAigCACABKAIAQX5xajYCACABIARGDQAgASABKAIAQQF2akEEaiEACyAAIAI2AgALIAIoAgBBAXZBeGoiAEEIIABBCEsbZ0Efc0ECdEGAH2oiASgCACEAIAEgBTYCACACIAA2AgwgAkEANgIIIABFDQEgACAFNgIADwsCQCABRQ0AIAEoAgAiAkEBcQ0AIAJBAXZBeGoiAkEIIAJBCEsbZ0Efc0ECdEGAH2oiAigCACABQQhqRgRAIAIgASgCDDYCAAsgASgCCCICBEAgAiABKAIMNgIECyABKAIMIgIEQCACIAEoAgg2AgBBhCAoAgAhBAsgACAAKAIAIAEoAgBBfnFqIgI2AgACQCABIARHBEAgASABKAIAQQF2aiAANgIEIAAoAgAhAgwBC0GEICAANgIACyACQQF2QXhqIgFBCCABQQhLG2dBH3NBAnRBgB9qIgIoAgAhASACIABBCGoiAjYCACAAIAE2AgwgAEEANgIIIAFFDQEgASACNgIADwsgBUEBdkF4aiIBQQggAUEISxtnQR9zQQJ0QYAfaiICKAIAIQEgAiAAQQhqIgI2AgAgACABNgIMIABBADYCCCABRQ0AIAEgAjYCAAsLDgAgAARAIABBeGoQJQsLgAIBA38CQCAAQQ9qQXhxQYQgKAIAKAIAQQF2ayICEB1Bf0YNAAJAQYQgKAIAIgAoAgAiAUEBcQ0AIAFBAXZBeGoiAUEIIAFBCEsbZ0Efc0ECdEGAH2oiASgCACAAQQhqRgRAIAEgACgCDDYCAAsgACgCCCIBBEAgASAAKAIMNgIECyAAKAIMIgFFDQAgASAAKAIINgIAC0EBIQEgACAAKAIAIAJBAXRqIgI2AgAgAkEBcQ0AIAJBAXZBeGoiAkEIIAJBCEsbZ0Efc0ECdEGAH2oiAygCACECIAMgAEEIaiIDNgIAIAAgAjYCDCAAQQA2AgggAkUNACACIAM2AgALIAELtwIBA38CQAJAIABBASAAGyICEDgiAA0AAkACQEGEICgCACIARQ0AIAAoAgAiA0EBcQ0AIAAgA0EBcjYCACADQQF2QXhqIgFBCCABQQhLG2dBH3NBAnRBgB9qIgEoAgAgAEEIakYEQCABIAAoAgw2AgALIAAoAggiAQRAIAEgACgCDDYCBAsgACgCDCIBBEAgASAAKAIINgIACyACECchAkEAIQFBhCAoAgAhACACDQEgACAAKAIAQX5xNgIAQQAPCyACQQ9qQXhxIgMQHSICQX9GDQIgAkEHakF4cSIAIAJHBEAgACACaxAdQX9GDQMLAkBBhCAoAgAiAUUEQEGAICAANgIADAELIAAgATYCBAtBhCAgADYCACAAIANBAXRBAXI2AgAMAQsgAEUNAQsgAEEIaiEBCyABC7kDAQJ/IAAgA2ohBQJAIANBB0wEQANAIAAgBU8NAiAAIAItAAA6AAAgAEEBaiEAIAJBAWohAgwAAAsACyAEQQFGBEACQCAAIAJrIgZBB00EQCAAIAItAAA6AAAgACACLQABOgABIAAgAi0AAjoAAiAAIAItAAM6AAMgAEEEaiACIAZBAnQiBkHAHmooAgBqIgIQFyACIAZB4B5qKAIAayECDAELIAAgAhAMCyACQQhqIQIgAEEIaiEACwJAAkACQAJAIAUgAU0EQCAAIANqIQEgBEEBRyAAIAJrQQ9Kcg0BA0AgACACEAwgAkEIaiECIABBCGoiACABSQ0ACwwFCyAAIAFLBEAgACEBDAQLIARBAUcgACACa0EPSnINASAAIQMgAiEEA0AgAyAEEAwgBEEIaiEEIANBCGoiAyABSQ0ACwwCCwNAIAAgAhAHIAJBEGohAiAAQRBqIgAgAUkNAAsMAwsgACEDIAIhBANAIAMgBBAHIARBEGohBCADQRBqIgMgAUkNAAsLIAIgASAAa2ohAgsDQCABIAVPDQEgASACLQAAOgAAIAFBAWohASACQQFqIQIMAAALAAsLQQECfyAAIAAoArjgASIDNgLE4AEgACgCvOABIQQgACABNgK84AEgACABIAJqNgK44AEgACABIAQgA2tqNgLA4AELpgEBAX8gACAAKALs4QEQFjYCyOABIABCADcD+OABIABCADcDuOABIABBwOABakIANwMAIABBqNAAaiIBQYyAgOAANgIAIABBADYCmOIBIABCADcDiOEBIABCAzcDgOEBIABBrNABakHgEikCADcCACAAQbTQAWpB6BIoAgA2AgAgACABNgIMIAAgAEGYIGo2AgggACAAQaAwajYCBCAAIABBEGo2AgALYQEBf0G4fyEDAkAgAUEDSQ0AIAIgABAhIgFBA3YiADYCCCACIAFBAXE2AgQgAiABQQF2QQNxIgM2AgACQCADQX9qIgFBAksNAAJAIAFBAWsOAgEAAgtBbA8LIAAhAwsgAwsMACAAIAEgAkEAEC4LiAQCA38CfiADEBYhBCAAQQBBKBAQIQAgBCACSwRAIAQPCyABRQRAQX8PCwJAAkAgA0EBRg0AIAEoAAAiBkGo6r5pRg0AQXYhAyAGQXBxQdDUtMIBRw0BQQghAyACQQhJDQEgAEEAQSgQECEAIAEoAAQhASAAQQE2AhQgACABrTcDAEEADwsgASACIAMQLyIDIAJLDQAgACADNgIYQXIhAyABIARqIgVBf2otAAAiAkEIcQ0AIAJBIHEiBkUEQEFwIQMgBS0AACIFQacBSw0BIAVBB3GtQgEgBUEDdkEKaq2GIgdCA4h+IAd8IQggBEEBaiEECyACQQZ2IQMgAkECdiEFAkAgAkEDcUF/aiICQQJLBEBBACECDAELAkACQAJAIAJBAWsOAgECAAsgASAEai0AACECIARBAWohBAwCCyABIARqLwAAIQIgBEECaiEEDAELIAEgBGooAAAhAiAEQQRqIQQLIAVBAXEhBQJ+AkACQAJAIANBf2oiA0ECTQRAIANBAWsOAgIDAQtCfyAGRQ0DGiABIARqMQAADAMLIAEgBGovAACtQoACfAwCCyABIARqKAAArQwBCyABIARqKQAACyEHIAAgBTYCICAAIAI2AhwgACAHNwMAQQAhAyAAQQA2AhQgACAHIAggBhsiBzcDCCAAIAdCgIAIIAdCgIAIVBs+AhALIAMLWwEBf0G4fyEDIAIQFiICIAFNBH8gACACakF/ai0AACIAQQNxQQJ0QaAeaigC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C0Egak8NAQsgByAHKQNoNwMQIAcgBykDYDcDCCAEIA0gB0EIaiAHQdwAaiAPIA4gESAQEB4hCwwBCyACIARqIQggBCAKEAcgAkERTwRAIARBEGohAgNAIAIgCkEQaiIKEAcgAkEQaiICIAhJDQALCyAIIAlrIQIgByATNgJcIAkgCCAOa0sEQCAJIAggEWtLBEBBbCELDAILIBAgAiAOayICaiIKIANqIBBNBEAgCCAKIAMQDxoMAgsgCCAKQQAgAmsQDyEIIAcgAiADaiIDNgJkIAggAmshCCAOIQILIAlBEE8EQCADIAhqIQMDQCAIIAIQByACQRBqIQIgCEEQaiIIIANJDQALDAELAkAgCUEHTQRAIAggAi0AADoAACAIIAItAAE6AAEgCCACLQACOgACIAggAi0AAzoAAyAIQQRqIAIgCUECdCIDQcAeaigCAGoiAhAXIAIgA0HgHmooAgBrIQIgBygCZCEDDAELIAggAhAMCyADQQlJDQAgAyAIaiEDIAhBCGoiCCACQQhqIgJrQQ9MBEADQCAIIAIQDCACQQhqIQIgCEEIaiIIIANJDQAMAgALAAsDQCAIIAIQByACQRBqIQIgCEEQaiIIIANJDQALCyAHQRhqEAQaIAsgDCALEAMiAhshDCAEIAQgC2ogAhshBCAFQX9qIgUNAAsgDBADDQFBbCEMIAdBGGoQBEECSQ0BQQAhCANAIAhBA0cEQCAAIAhBAnQiAmpBrNABaiACIAdqKAJENgIAIAhBAWohCAwBCwsgBygCXCEIC0G6fyEMIA8gCGsiACANIARrSw0AIAQEfyAEIAggABALIABqBUEACyABayEMCyAHQfAAaiQAIAwLkRcCFn8FfiMAQdABayIHJAAgByAAKALw4QEiCDYCvAEgASACaiESIAggACgCgOIBaiETAkACQCAFRQRAIAEhAwwBCyAAKALE4AEhESAAKALA4AEhFSAAKAK84AEhDyAAQQE2AozhAUEAIQgDQCAIQQNHBEAgByAIQQJ0IgJqIAAgAmpBrNABaigCADYCVCAIQQFqIQgMAQsLIAcgETYCZCAHIA82AmAgByABIA9rNgJoQWwhECAHQShqIAMgBBAGEAMNASAFQQQgBUEESBshFyAHQTxqIAdBKGogACgCABATIAdBxABqIAdBKGogACgCCBATIAdBzABqIAdB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IAdB0AFqJAAgEAslACAAQgA3AgAgAEEAOwEIIABBADoACyAAIAE2AgwgACACOgAKC7QFAQN/IwBBMGsiBCQAIABB/wFqIgVBfWohBgJAIAMvAQIEQCAEQRhqIAEgAhAGIgIQAw0BIARBEGogBEEYaiADEBwgBEEIaiAEQRhqIAMQHCAAIQMDQAJAIARBGGoQBCADIAZPckUEQCADIARBEGogBEEYahASOgAAIAMgBEEIaiAEQRhqEBI6AAEgBEEYahAERQ0BIANBAmohAwsgBUF+aiEFAn8DQEG6fyECIAMiASAFSw0FIAEgBEEQaiAEQRhqEBI6AAAgAUEBaiEDIARBGGoQBEEDRgRAQQIhAiAEQQhqDAILIAMgBUsNBSABIARBCGogBEEYahASOgABIAFBAmohA0EDIQIgBEEYahAEQQNHDQALIARBEGoLIQUgAyAFIARBGGoQEjoAACABIAJqIABrIQIMAwsgAyAEQRBqIARBGGoQEjoAAiADIARBCGogBEEYahASOgADIANBBGohAwwAAAsACyAEQRhqIAEgAhAGIgIQAw0AIARBEGogBEEYaiADEBwgBEEIaiAEQRhqIAMQHCAAIQMDQAJAIARBGGoQBCADIAZPckUEQCADIARBEGogBEEYahAROgAAIAMgBEEIaiAEQRhqEBE6AAEgBEEYahAERQ0BIANBAmohAwsgBUF+aiEFAn8DQEG6fyECIAMiASAFSw0EIAEgBEEQaiAEQRhqEBE6AAAgAUEBaiEDIARBGGoQBEEDRgRAQQIhAiAEQQhqDAILIAMgBUsNBCABIARBCGogBEEYahAROgABIAFBAmohA0EDIQIgBEEYahAEQQNHDQALIARBEGoLIQUgAyAFIARBGGoQEToAACABIAJqIABrIQIMAgsgAyAEQRBqIARBGGoQEToAAiADIARBCGogBEEYahAROgADIANBBGohAwwAAAsACyAEQTBqJAAgAgtpAQF/An8CQAJAIAJBB00NACABKAAAQbfIwuF+Rw0AIAAgASgABDYCmOIBQWIgAEEQaiABIAIQPiIDEAMNAhogAEKBgICAEDcDiOEBIAAgASADaiACIANrECoMAQsgACABIAIQKgtBAAsLrQMBBn8jAEGAAWsiAyQAQWIhCAJAIAJBCUkNACAAQZjQAGogAUEIaiIEIAJBeGogAEGY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wOABCwutAgIEfwF+IwBBQGoiBCQAAkACQCACQQhJDQAgASgAAEFwcUHQ1LTCAUcNACABIAIQIiEBIABCADcDCCAAQQA2AgQgACABNgIADAELIARBGGogASACEC0iAxADBEAgACADEBoMAQsgAwRAIABBuH8QGgwBCyACIAQoAjAiA2shAiABIANqIQMDQAJAIAAgAyACIARBCGoQLCIFEAMEfyAFBSACIAVBA2oiBU8NAUG4fwsQGgwCCyAGQQFqIQYgAiAFayECIAMgBWohAyAEKAIMRQ0ACyAEKAI4BEAgAkEDTQRAIABBuH8QGgwCCyADQQRqIQMLIAQoAighAiAEKQMYIQcgAEEANgIEIAAgAyABazYCACAAIAIgBmytIAcgB0J/URs3AwgLIARBQGskAAslAQF/IwBBEGsiAiQAIAIgACABEFEgAigCACEAIAJBEGokACAAC30BBH8jAEGQBGsiBCQAIARB/wE2AggCQCAEQRBqIARBCGogBEEMaiABIAIQFSIGEAMEQCAGIQUMAQtBVCEFIAQoAgwiB0EGSw0AIAMgBEEQaiAEKAIIIAcQQSIFEAMNACAAIAEgBmogAiAGayADEDwhBQsgBEGQBGokACAFC4cBAgJ/An5BABAWIQMCQANAIAEgA08EQAJAIAAoAABBcHFB0NS0wgFGBEAgACABECIiAhADRQ0BQn4PCyAAIAEQVSIEQn1WDQMgBCAFfCIFIARUIQJCfiEEIAINAyAAIAEQUiICEAMNAwsgASACayEBIAAgAmohAAwBCwtCfiAFIAEbIQQLIAQLPwIBfwF+IwBBMGsiAiQAAn5CfiACQQhqIAAgARAtDQAaQgAgAigCHEEBRg0AGiACKQMICyEDIAJBMGokACADC40BAQJ/IwBBMGsiASQAAkAgAEUNACAAKAKI4gENACABIABB/OEBaigCADYCKCABIAApAvThATcDICAAEDAgACgCqOIBIQIgASABKAIoNgIYIAEgASkDIDcDECACIAFBEGoQGyAAQQA2AqjiASABIAEoAig2AgggASABKQMgNwMAIAAgARAbCyABQTBqJAALKgECfyMAQRBrIgAkACAAQQA2AgggAEIANwMAIAAQWCEBIABBEGokACABC4cBAQN/IwBBEGsiAiQAAkAgACgCAEUgACgCBEVzDQAgAiAAKAIINgIIIAIgACkCADcDAAJ/IAIoAgAiAQRAIAIoAghBqOMJIAERBQAMAQtBqOMJECgLIgFFDQAgASAAKQIANwL04QEgAUH84QFqIAAoAgg2AgAgARBZIAEhAwsgAkEQaiQAIAMLywEBAn8jAEEgayIBJAAgAEGBgIDAADYCtOIBIABBADYCiOIBIABBADYC7OEBIABCADcDkOIBIABBADYCpOMJIABBADYC3OIBIABCADcCzOIBIABBADYCvOIBIABBADYCxOABIABCADcCnOIBIABBpOIBakIANwIAIABBrOIBakEANgIAIAFCADcCECABQgA3AhggASABKQMYNwMIIAEgASkDEDcDACABKAIIQQh2QQFxIQIgAEEANgLg4gEgACACNgKM4gEgAUEgaiQAC3YBA38jAEEwayIBJAAgAARAIAEgAEHE0AFqIgIoAgA2AiggASAAKQK80AE3AyAgACgCACEDIAEgAigCADYCGCABIAApArzQATcDECADIAFBEGoQGyABIAEoAig2AgggASABKQMgNwMAIAAgARAbCyABQTBqJAALzAEBAX8gACABKAK00AE2ApjiASAAIAEoAgQiAjYCwOABIAAgAjYCvOABIAAgAiABKAIIaiICNgK44AEgACACNgLE4AEgASgCuNABBEAgAEKBgICAEDcDiOEBIAAgAUGk0ABqNgIMIAAgAUGUIGo2AgggACABQZwwajYCBCAAIAFBDGo2AgAgAEGs0AFqIAFBqNABaigCADYCACAAQbDQAWogAUGs0AFqKAIANgIAIABBtNABaiABQbDQAWooAgA2AgAPCyAAQgA3A4jhAQs7ACACRQRAQbp/DwsgBEUEQEFsDwsgAiAEEGAEQCAAIAEgAiADIAQgBRBhDwsgACABIAIgAyAEIAUQZQtGAQF/IwBBEGsiBSQAIAVBCGogBBAOAn8gBS0ACQRAIAAgASACIAMgBBAyDAELIAAgASACIAMgBBA0CyEAIAVBEGokACAACzQAIAAgAyAEIAUQNiIFEAMEQCAFDwsgBSAESQR/IAEgAiADIAVqIAQgBWsgABA1BUG4fwsLRgEBfyMAQRBrIgUkACAFQQhqIAQQDgJ/IAUtAAkEQCAAIAEgAiADIAQQYgwBCyAAIAEgAiADIAQQNQshACAFQRBqJAAgAAtZAQF/QQ8hAiABIABJBEAgAUEE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";var hA="display-p3",uA="display-p3-linear";var $h=new WeakMap,eu=0,tu,_i=class i extends on{constructor(e){super(e),this.transcoderPath="",this.transcoderBinary=null,this.transcoderPending=null,this.workerPool=new yc,this.workerSourceURL="",this.workerConfig=null,typeof MSC_TRANSCODER<"u"&&console.warn('THREE.KTX2Loader: Please update to latest "basis_transcoder". "msc_basis_transcoder" is no longer supported in three.js r125+.')}setTranscoderPath(e){return this.transcoderPath=e,this}setWorkerLimit(e){return this.workerPool.setWorkerLimit(e),this}async detectSupportAsync(e){return this.workerConfig={astcSupported:await e.hasFeatureAsync("texture-compression-astc"),astcHDRSupported:!1,etc1Supported:await e.hasFeatureAsync("texture-compression-etc1"),etc2Supported:await e.hasFeatureAsync("texture-compression-etc2"),dxtSupported:await e.hasFeatureAsync("texture-compression-bc"),bptcSupported:await e.hasFeatureAsync("texture-compression-bptc"),pvrtcSupported:await e.hasFeatureAsync("texture-compression-pvrtc")},this}detectSupport(e){return e.isWebGPURenderer===!0?this.workerConfig={astcSupported:e.hasFeature("texture-compression-astc"),astcHDRSupported:!1,etc1Supported:e.hasFeature("texture-compression-etc1"),etc2Supported:e.hasFeature("texture-compression-etc2"),dxtSupported:e.hasFeature("texture-compression-bc"),bptcSupported:e.hasFeature("texture-compression-bptc"),pvrtcSupported:e.hasFeature("texture-compression-pvrtc")}:this.workerConfig={astcSupported:e.extensions.has("WEBGL_compressed_texture_astc"),astcHDRSupported:e.extensions.has("WEBGL_compressed_texture_astc")&&e.extensions.get("WEBGL_compressed_texture_astc").getSupportedProfiles().includes("hdr"),etc1Supported:e.extensions.has("WEBGL_compressed_texture_etc1"),etc2Supported:e.extensions.has("WEBGL_compressed_texture_etc"),dxtSupported:e.extensions.has("WEBGL_compressed_texture_s3tc"),bptcSupported:e.extensions.has("EXT_texture_compression_bptc"),pvrtcSupported:e.extensions.has("WEBGL_compressed_texture_pvrtc")||e.extensions.has("WEBKIT_WEBGL_compressed_texture_pvrtc")},this}init(){if(!this.transcoderPending){let e=new pn(this.manager);e.setPath(this.transcoderPath),e.setWithCredentials(this.withCredentials);let t=e.loadAsync("basis_transcoder.js"),n=new pn(this.manager);n.setPath(this.transcoderPath),n.setResponseType("arraybuffer"),n.setWithCredentials(this.withCredentials);let s=n.loadAsync("basis_transcoder.wasm");this.transcoderPending=Promise.all([t,s]).then(([r,o])=>{let a=i.BasisWorker.toString(),c=["/* constants */","let _EngineFormat = "+JSON.stringify(i.EngineFormat),"let _EngineType = "+JSON.stringify(i.EngineType),"let _TranscoderFormat = "+JSON.stringify(i.TranscoderFormat),"let _BasisFormat = "+JSON.stringify(i.BasisFormat),"/* basis_transcoder.js */",r,"/* worker */",a.substring(a.indexOf("{")+1,a.lastIndexOf("}"))].join(`
`);this.workerSourceURL=URL.createObjectURL(new Blob([c])),this.transcoderBinary=o,this.workerPool.setWorkerCreator(()=>{let l=new Worker(this.workerSourceURL),h=this.transcoderBinary.slice(0);return l.postMessage({type:"init",config:this.workerConfig,transcoderBinary:h},[h]),l})}),eu>0&&console.warn("THREE.KTX2Loader: Multiple active KTX2 loaders may cause performance issues. Use a single KTX2Loader instance, or call .dispose() on old instances."),eu++}return this.transcoderPending}load(e,t,n,s){if(this.workerConfig===null)throw new Error("THREE.KTX2Loader: Missing initialization with `.detectSupport( renderer )`.");let r=new pn(this.manager);r.setResponseType("arraybuffer"),r.setWithCredentials(this.withCredentials),r.load(e,o=>{this.parse(o,t,s)},n,s)}parse(e,t,n){if(this.workerConfig===null)throw new Error("THREE.KTX2Loader: Missing initialization with `.detectSupport( renderer )`.");if($h.has(e))return $h.get(e).promise.then(t).catch(n);this._createTexture(e).then(s=>t?t(s):null).catch(n)}_createTextureFrom(e,t){let{type:n,error:s,data:{faces:r,width:o,height:a,format:c,type:l,dfdFlags:h}}=e;if(n==="error")return Promise.reject(s);let u;if(t.faceCount===6)u=new ro(r,c,l);else{let d=r[0].mipmaps;u=t.layerCount>1?new so(d,o,a,t.layerCount,c,l):new Di(d,o,a,c,l)}return u.minFilter=r[0].mipmaps.length===1?It:an,u.magFilter=It,u.generateMipmaps=!1,u.needsUpdate=!0,u.colorSpace=wA(t),u.premultiplyAlpha=!!(h&1),u}async _createTexture(e,t={}){let n=cA(new Uint8Array(e)),s=n.vkFormat===1000066e3&&n.dataFormatDescriptor[0].colorModel===167;if(!(n.vkFormat===0||s&&!this.workerConfig.astcHDRSupported))return Wy(n);let o=t,a=this.init().then(()=>this.workerPool.postMessage({type:"transcode",buffer:e,taskConfig:o},[e])).then(c=>this._createTextureFrom(c.data,n));return $h.set(e,{promise:a}),a}dispose(){return this.workerPool.dispose(),this.workerSourceURL&&URL.revokeObjectURL(this.workerSourceURL),eu--,this}};_i.BasisFormat={ETC1S:0,UASTC:1,UASTC_HDR:2};_i.TranscoderFormat={ETC1:0,ETC2:1,BC1:2,BC3:3,BC4:4,BC5:5,BC7_M6_OPAQUE_ONLY:6,BC7_M5:7,PVRTC1_4_RGB:8,PVRTC1_4_RGBA:9,ASTC_4x4:10,ATC_RGB:11,ATC_RGBA_INTERPOLATED_ALPHA:12,RGBA32:13,RGB565:14,BGR565:15,RGBA4444:16,BC6H:22,RGB_HALF:24,RGBA_HALF:25};_i.EngineFormat={RGBAFormat:Tt,RGBA_ASTC_4x4_Format:gs,RGB_BPTC_UNSIGNED_Format:pr,RGBA_BPTC_Format:Es,RGBA_ETC2_EAC_Format:Ar,RGBA_PVRTC_4BPPV1_Format:ur,RGBA_S3TC_DXT5_Format:ms,RGB_ETC1_Format:dr,RGB_ETC2_Format:fr,RGB_PVRTC_4BPPV1_Format:hr,RGBA_S3TC_DXT1_Format:ps};_i.EngineType={UnsignedByteType:vt,HalfFloatType:mn,FloatType:Dt};_i.BasisWorker=function(){let i,e,t,n=_EngineFormat,s=_EngineType,r=_TranscoderFormat,o=_BasisFormat;self.addEventListener("message",function(m){let g=m.data;switch(g.type){case"init":i=g.config,a(g.transcoderBinary);break;case"transcode":e.then(()=>{try{let{faces:p,buffers:A,width:I,height:C,hasAlpha:E,format:w,type:v,dfdFlags:T}=c(g.buffer);self.postMessage({type:"transcode",id:g.id,data:{faces:p,width:I,height:C,hasAlpha:E,format:w,type:v,dfdFlags:T}},A)}catch(p){console.error(p),self.postMessage({type:"error",id:g.id,error:p.message})}});break}});function a(m){e=new Promise(g=>{t={wasmBinary:m,onRuntimeInitialized:g},BASIS(t)}).then(()=>{t.initializeBasis(),t.KTX2File===void 0&&console.warn("THREE.KTX2Loader: Please update Basis Universal transcoder.")})}function c(m){let g=new t.KTX2File(new Uint8Array(m));function p(){g.close(),g.delete()}if(!g.isValid())throw p(),new Error("THREE.KTX2Loader:	Invalid or unsupported .ktx2 file");let A;if(g.isUASTC())A=o.UASTC;else if(g.isETC1S())A=o.ETC1S;else if(g.isHDR())A=o.UASTC_HDR;else throw new Error("THREE.KTX2Loader: Unknown Basis encoding");let I=g.getWidth(),C=g.getHeight(),E=g.getLayers()||1,w=g.getLevels(),v=g.getFaces(),T=g.getHasAlpha(),F=g.getDFDFlags(),{transcoderFormat:M,engineFormat:x,engineType:R}=u(A,I,C,T);if(!I||!C||!w)throw p(),new Error("THREE.KTX2Loader:	Invalid texture");if(!g.startTranscoding())throw p(),new Error("THREE.KTX2Loader: .startTranscoding failed");let G=[],N=[];for(let H=0;H<v;H++){let Y=[];for(let z=0;z<w;z++){let J=[],k,te;for(let ge=0;ge<E;ge++){let Be=g.getImageLevelInfo(z,ge,H);H===0&&z===0&&ge===0&&(Be.origWidth%4!==0||Be.origHeight%4!==0)&&console.warn("THREE.KTX2Loader: ETC1S and UASTC textures should use multiple-of-four dimensions."),w>1?(k=Be.origWidth,te=Be.origHeight):(k=Be.width,te=Be.height);let Ve=new Uint8Array(g.getImageTranscodedSizeInBytes(z,ge,0,M)),W=g.transcodeImage(Ve,z,ge,H,M,0,-1,-1);if(R===s.HalfFloatType&&(Ve=new Uint16Array(Ve.buffer,Ve.byteOffset,Ve.byteLength/Uint16Array.BYTES_PER_ELEMENT)),!W)throw p(),new Error("THREE.KTX2Loader: .transcodeImage failed.");J.push(Ve)}let le=f(J);Y.push({data:le,width:k,height:te}),N.push(le.buffer)}G.push({mipmaps:Y,width:I,height:C,format:x,type:R})}return p(),{faces:G,buffers:N,width:I,height:C,hasAlpha:T,dfdFlags:F,format:x,type:R}}let l=[{if:"astcSupported",basisFormat:[o.UASTC],transcoderFormat:[r.ASTC_4x4,r.ASTC_4x4],engineFormat:[n.RGBA_ASTC_4x4_Format,n.RGBA_ASTC_4x4_Format],engineType:[s.UnsignedByteType],priorityETC1S:1/0,priorityUASTC:1,needsPowerOfTwo:!1},{if:"bptcSupported",basisFormat:[o.ETC1S,o.UASTC],transcoderFormat:[r.BC7_M5,r.BC7_M5],engineFormat:[n.RGBA_BPTC_Format,n.RGBA_BPTC_Format],engineType:[s.UnsignedByteType],priorityETC1S:3,priorityUASTC:2,needsPowerOfTwo:!1},{if:"dxtSupported",basisFormat:[o.ETC1S,o.UASTC],transcoderFormat:[r.BC1,r.BC3],engineFormat:[n.RGBA_S3TC_DXT1_Format,n.RGBA_S3TC_DXT5_Format],engineType:[s.UnsignedByteType],priorityETC1S:4,priorityUASTC:5,needsPowerOfTwo:!1},{if:"etc2Supported",basisFormat:[o.ETC1S,o.UASTC],transcoderFormat:[r.ETC1,r.ETC2],engineFormat:[n.RGB_ETC2_Format,n.RGBA_ETC2_EAC_Format],engineType:[s.UnsignedByteType],priorityETC1S:1,priorityUASTC:3,needsPowerOfTwo:!1},{if:"etc1Supported",basisFormat:[o.ETC1S,o.UASTC],transcoderFormat:[r.ETC1],engineFormat:[n.RGB_ETC1_Format],engineType:[s.UnsignedByteType],priorityETC1S:2,priorityUASTC:4,needsPowerOfTwo:!1},{if:"pvrtcSupported",basisFormat:[o.ETC1S,o.UASTC],transcoderFormat:[r.PVRTC1_4_RGB,r.PVRTC1_4_RGBA],engineFormat:[n.RGB_PVRTC_4BPPV1_Format,n.RGBA_PVRTC_4BPPV1_Format],engineType:[s.UnsignedByteType],priorityETC1S:5,priorityUASTC:6,needsPowerOfTwo:!0},{if:"bptcSupported",basisFormat:[o.UASTC_HDR],transcoderFormat:[r.BC6H],engineFormat:[n.RGB_BPTC_UNSIGNED_Format],engineType:[s.HalfFloatType],priorityHDR:1,needsPowerOfTwo:!1},{basisFormat:[o.ETC1S,o.UASTC],transcoderFormat:[r.RGBA32,r.RGBA32],engineFormat:[n.RGBAFormat,n.RGBAFormat],engineType:[s.UnsignedByteType,s.UnsignedByteType],priorityETC1S:100,priorityUASTC:100,needsPowerOfTwo:!1},{basisFormat:[o.UASTC_HDR],transcoderFormat:[r.RGBA_HALF],engineFormat:[n.RGBAFormat],engineType:[s.HalfFloatType],priorityHDR:100,needsPowerOfTwo:!1}],h={[o.ETC1S]:l.filter(m=>m.basisFormat.includes(o.ETC1S)).sort((m,g)=>m.priorityUASTC-g.priorityUASTC),[o.UASTC]:l.filter(m=>m.basisFormat.includes(o.UASTC)).sort((m,g)=>m.priorityUASTC-g.priorityUASTC),[o.UASTC_HDR]:l.filter(m=>m.basisFormat.includes(o.UASTC_HDR)).sort((m,g)=>m.priorityHDR-g.priorityHDR)};function u(m,g,p,A){let I=h[m];for(let C=0;C<I.length;C++){let E=I[C];if(E.if&&!i[E.if]||!E.basisFormat.includes(m)||A&&E.transcoderFormat.length<2||E.needsPowerOfTwo&&!(d(g)&&d(p)))continue;let w=E.transcoderFormat[A?1:0],v=E.engineFormat[A?1:0],T=E.engineType[0];return{transcoderFormat:w,engineFormat:v,engineType:T}}throw new Error("THREE.KTX2Loader: Failed to identify transcoding target.")}function d(m){return m<=2?!0:(m&m-1)===0&&m!==0}function f(m){if(m.length===1)return m[0];let g=0;for(let I=0;I<m.length;I++){let C=m[I];g+=C.byteLength}let p=new Uint8Array(g),A=0;for(let I=0;I<m.length;I++){let C=m[I];p.set(C,A),A+=C.byteLength}return p}};var zy=new Set([Tt,pi,qn]),nu={109:Tt,97:Tt,37:Tt,43:Tt,103:pi,83:pi,16:pi,22:pi,100:qn,76:qn,15:qn,9:qn,1000066e3:gs,166:_s,165:_s},iu={109:Dt,97:mn,37:vt,43:vt,103:Dt,83:mn,16:vt,22:vt,100:Dt,76:mn,15:vt,9:vt,1000066e3:mn,166:vt,165:vt};async function Wy(i){let{vkFormat:e}=i;if(nu[e]===void 0)throw new Error("THREE.KTX2Loader: Unsupported vkFormat.");let t;i.supercompressionScheme===2&&(tu||(tu=new Promise(async r=>{let o=new xc;await o.init(),r(o)})),t=await tu);let n=[];for(let r=0;r<i.levels.length;r++){let o=Math.max(1,i.pixelWidth>>r),a=Math.max(1,i.pixelHeight>>r),c=i.pixelDepth?Math.max(1,i.pixelDepth>>r):0,l=i.levels[r],h;if(i.supercompressionScheme===0)h=l.levelData;else if(i.supercompressionScheme===2)h=t.decode(l.levelData,l.uncompressedByteLength);else throw new Error("THREE.KTX2Loader: Unsupported supercompressionScheme.");let u;iu[e]===Dt?u=new Float32Array(h.buffer,h.byteOffset,h.byteLength/Float32Array.BYTES_PER_ELEMENT):iu[e]===mn?u=new Uint16Array(h.buffer,h.byteOffset,h.byteLength/Uint16Array.BYTES_PER_ELEMENT):u=h,n.push({data:u,width:o,height:a,depth:c})}let s;if(zy.has(nu[e]))s=i.pixelDepth===0?new rs(n[0].data,i.pixelWidth,i.pixelHeight):new er(n[0].data,i.pixelWidth,i.pixelHeight,i.pixelDepth);else{if(i.pixelDepth>0)throw new Error("THREE.KTX2Loader: Unsupported pixelDepth.");s=new Di(n,i.pixelWidth,i.pixelHeight),s.minFilter=n.length===1?It:an,s.magFilter=It}return s.mipmaps=n,s.type=iu[e],s.format=nu[e],s.colorSpace=wA(i),s.needsUpdate=!0,Promise.resolve(s)}function wA(i){let e=i.dataFormatDescriptor[0];return e.colorPrimaries===1?e.transferFunction===2?et:yt:e.colorPrimaries===10?e.transferFunction===2?hA:uA:e.colorPrimaries===0?In:(console.warn(`THREE.KTX2Loader: Unsupported color primaries, "${e.colorPrimaries}"`),In)}var Cc=class extends ss{constructor(){super();let e=new Bi;e.deleteAttribute("uv");let t=new Cn({side:Ut}),n=new Cn,s=new ls(16777215,900,28,2);s.position.set(.418,16.199,.3),this.add(s);let r=new Xe(e,t);r.position.set(-.757,13.219,.717),r.scale.set(31.713,28.305,28.591),this.add(r);let o=new Xe(e,n);o.position.set(-10.906,2.009,1.846),o.rotation.set(0,-.195,0),o.scale.set(2.328,7.905,4.651),this.add(o);let a=new Xe(e,n);a.position.set(-5.607,-.754,-.758),a.rotation.set(0,.994,0),a.scale.set(1.97,1.534,3.955),this.add(a);let c=new Xe(e,n);c.position.set(6.167,.857,7.803),c.rotation.set(0,.561,0),c.scale.set(3.927,6.285,3.687),this.add(c);let l=new Xe(e,n);l.position.set(-2.017,.018,6.124),l.rotation.set(0,.333,0),l.scale.set(2.002,4.566,2.064),this.add(l);let h=new Xe(e,n);h.position.set(2.291,-.756,-2.621),h.rotation.set(0,-.286,0),h.scale.set(1.546,1.552,1.496),this.add(h);let u=new Xe(e,n);u.position.set(-2.193,-.369,-5.547),u.rotation.set(0,.516,0),u.scale.set(3.875,3.487,2.986),this.add(u);let d=new Xe(e,Mr(50));d.position.set(-16.116,14.37,8.208),d.scale.set(.1,2.428,2.739),this.add(d);let f=new Xe(e,Mr(50));f.position.set(-16.109,18.021,-8.207),f.scale.set(.1,2.425,2.751),this.add(f);let m=new Xe(e,Mr(17));m.position.set(14.904,12.198,-1.832),m.scale.set(.15,4.265,6.331),this.add(m);let g=new Xe(e,Mr(43));g.position.set(-.462,8.89,14.52),g.scale.set(4.38,5.441,.088),this.add(g);let p=new Xe(e,Mr(20));p.position.set(3.235,11.486,-12.541),p.scale.set(2.5,2,.1),this.add(p);let A=new Xe(e,Mr(100));A.position.set(0,20,0),A.scale.set(1,.1,1),this.add(A)}dispose(){let e=new Set;this.traverse(t=>{t.isMesh&&(e.add(t.geometry),e.add(t.material))});for(let t of e)t.dispose()}};function Mr(i){let e=new en;return e.color.setScalar(i),e}function zt(i,e,t){return Math.min(Math.max(i,e),t)}function Tc(i,e,t,n,s=8){return{l:i+s,r:i+t-s,t:e+s,b:e+n-s}}function Sc(i,e,t,n,s,r){let o=i<t?t-i:i>t+s?i-(t+s):-Math.min(i-t,t+s-i),a=e<n?n-e:e>n+r?e-(n+r):-Math.min(e-n,n+r-e);return o<=0&&a<=0?-Math.min(-o,-a):o<=0?a:a<=0?o:Math.hypot(o,a)}function Ky(i,e,t,n,s,r,o=20){return Sc(i,e,t,n,s,r)>=o}function Xy(i,e,t,n,s){return[{cardX:i+s,cardY:null},{cardX:i-s-t,cardY:null},{cardX:null,cardY:e+s},{cardX:null,cardY:e-s-n}]}function qy(i,e,t){return{cardX:i.cardX??e,cardY:i.cardY??t}}function PA(i,e,t,n,s,r,o,a,c,l){let h=wc(t,n,s,r,c,l);return{cardX:h.x,cardY:h.y,clear:Sc(i,e,h.x,h.y,s,r),move:Math.hypot(h.x-o,h.y-a)}}function cu(i,e){let t=i.clear>=0,n=e.clear>=0;return t!==n?t?-1:1:Math.abs(i.clear-e.clear)>1e-6?e.clear-i.clear:Math.abs(i.move-e.move)>1e-6?i.move-e.move:i.cardX!==e.cardX?i.cardX-e.cardX:i.cardY-e.cardY}function bA(i,e){let t=e.minX??8,n=e.minY??66,s=e.maxY??n,r=(t+i)/2,o=(n+s)/2,a=[t,i,r],c=[n,s,o],l=[];for(let h of a)for(let u of c)l.push({cardX:h,cardY:u});return l}function Mc(i,e,t,n,s,r,o){let a=[];for(let c of Xy(i,e,t,n,o))a.push(qy(c,s,r));return a}function ru(i,e,t,n,s,r,o,a,c,l){let h=null;for(let u of c){let d=PA(i,e,u.cardX,u.cardY,t,n,s,r,o,a);d.clear<l||(!h||cu(d,h)<0)&&(h=d)}return h}function BA(i,e,t,n,s,r,o,a,c){let l=null;for(let h of c){let u=PA(i,e,h.cardX,h.cardY,t,n,s,r,o,a);(!l||cu(u,l)<0)&&(l=u)}return l}function Yy(i,e,t,n,s,r,o={}){let a=o.gap??20,c=o.maxX??t,l=o.relaxedMaxX??c,h=t,u=n,d=ax(t,n,s,r,o),f=[...new Set([a,16,12,8,4,0])].sort((E,w)=>w-E),m=bA(c,o),g=bA(l,o);if(Ky(i,e,d.cardX,d.cardY,s,r,a))return{...d,degraded:!1,clearance:Sc(i,e,d.cardX,d.cardY,s,r)};for(let E of f){let w=Mc(i,e,s,r,t,n,E),v=ru(i,e,s,r,h,u,c,o,w,E);if(v)return{cardX:v.cardX,cardY:v.cardY,degraded:E<a,clearance:v.clear}}let p=[];for(let E of f)p.push(...Mc(i,e,s,r,t,n,E));p.push(...m);let A=ru(i,e,s,r,h,u,c,o,p,0),I=!1;if(!A&&l>c){p=[];for(let E of f)p.push(...Mc(i,e,s,r,t,n,E));p.push(...g),A=ru(i,e,s,r,h,u,l,o,p,0),I=!!A}if(!A){p=[];for(let v of f)p.push(...Mc(i,e,s,r,t,n,v));p.push(...m,...g);let E=BA(i,e,s,r,h,u,c,o,p),w=l>c?BA(i,e,s,r,h,u,l,o,p):null;A=w&&cu(w,E)<0?w:E,I=!!(w&&A===w)}let C=(A==null?void 0:A.clear)??Sc(i,e,d.cardX,d.cardY,s,r);return{cardX:(A==null?void 0:A.cardX)??d.cardX,cardY:(A==null?void 0:A.cardY)??d.cardY,degraded:C<a||I,clearance:C,panelOverlap:C<0,reserveRelaxed:I}}function So(i){return i=i||{},{leader:i.leader||"elbow",dir:i.dir||"auto",stub:Math.max(16,RA(i.leaderGap,48)),tail:RA(i.leaderTail,0),mode:i.elbowMode||"orthogonal",leg1Axis:i.leg1Axis||"auto",leg2Axis:i.leg2Axis||"auto"}}function RA(i,e){return typeof i=="number"&&isFinite(i)?i:e}var Jy=40;function ou(i,e,t,n,s,r){let o=i-t,a=e-n,c=s-t,l=r-n,h=Math.hypot(o,a)||1,u=Math.hypot(c,l)||1;return Math.acos(zt(o/h*c/u+a/h*l/u,-1,1))*180/Math.PI}function FA(i,e,t,n,s,r,o=.01){let a=t-i,c=n-e,l=s-t,h=r-n;return Math.hypot(a,c)<4||Math.hypot(l,h)<4?!1:Math.abs(a*l+c*h)<o}function UA(i,e,t){return{l1:Math.hypot(t.kx-i,t.ky-e),l2:Math.hypot(t.ax-t.kx,t.ay-t.ky)}}function DA(i,e,t){let n=[];for(let s of[t.l,t.r]){let r=zt(e,t.t,t.b);n.push({kx:s,ky:e,ax:s,ay:r,first:"h"})}for(let s of[t.t,t.b]){let r=zt(i,t.l,t.r);Math.abs(r-i)>=4&&n.push({kx:r,ky:e,ax:r,ay:s,first:"h"})}return n}function LA(i,e,t){let n=[];for(let s of[t.t,t.b]){let r=zt(i,t.l,t.r);n.push({kx:i,ky:s,ax:r,ay:s,first:"v"})}for(let s of[t.l,t.r]){let r=zt(e,t.t,t.b);Math.abs(r-e)>=4&&n.push({kx:i,ky:r,ax:s,ay:r,first:"v"})}return n}function Zy(i,e,t,n){let{l1:s,l2:r}=UA(i,e,t),o=(n.l+n.r)/2,a=(n.t+n.b)/2,c=0;return t.first==="h"?(i<n.l&&t.ax===n.l&&(c-=80),i>n.r&&t.ax===n.r&&(c-=80)):(e<n.t&&t.ay===n.t&&(c-=80),e>n.b&&t.ay===n.b&&(c-=80)),Math.abs(i-o)>=Math.abs(a-e)&&t.first==="h"&&(c-=12),Math.abs(i-o)<Math.abs(a-e)&&t.first==="v"&&(c-=12),c+s+r}function jy(i,e){return i.kx!==e.kx?i.kx-e.kx:i.ky!==e.ky?i.ky-e.ky:i.ax!==e.ax?i.ax-e.ax:i.ay-e.ay}function NA(i,e,t,n){let s=null,r=1e18;for(let o of t){if(!FA(i,e,o.kx,o.ky,o.ax,o.ay))continue;let a=Zy(i,e,o,o._b);n&&o.first===n&&(a-=.01),(!s||a<r-1e-9||Math.abs(a-r)<1e-9&&jy(o,s)<0)&&(r=a,s=o)}return s}function Ic(i,e,t,n){let{kx:s,ky:r,ax:o,ay:a}=t,c=Math.hypot(s-i,r-e),l=Math.hypot(o-s,a-r);return!(![i,e,s,r,o,a,c,l].every(Number.isFinite)||c<4||l<4||!FA(i,e,s,r,o,a)||n==="h"&&Math.abs(r-e)>.5||n==="v"&&Math.abs(s-i)>.5)}function OA(i,e,t){return i>=t.l&&i<=t.r&&e>=t.t&&e<=t.b}function QA(i,e,t){let n=i-t.l,s=t.r-i,r=e-t.t,o=t.b-e,a=(t.l+t.r)/2,c=(t.t+t.b)/2,l=[];return n>0&&l.push({kx:t.l,ky:e,ax:t.l,ay:e<=c?t.t:t.b,first:"h"}),s>0&&l.push({kx:t.r,ky:e,ax:t.r,ay:e<=c?t.t:t.b,first:"h"}),r>0&&l.push({kx:i,ky:t.t,ax:i<=a?t.l:t.r,ay:t.t,first:"v"}),o>0&&l.push({kx:i,ky:t.b,ax:i<=a?t.l:t.r,ay:t.b,first:"v"}),l}function $y(i,e,t,n,s,r,o){let a=Tc(t,n,s,r);if(OA(i,e,a)){let h=QA(i,e,a).map(d=>({...d,_b:a})),u=NA(i,e,h);if(u)return u}if(o==="h"){let h=i-a.l<=a.r-i?a.l:a.r,u=zt(e,a.t,a.b);return{kx:h,ky:e,ax:h,ay:u,first:"h"}}if(o==="v"){let h=e-a.t<=a.b-e?a.t:a.b,u=zt(i,a.l,a.r);return{kx:i,ky:h,ax:u,ay:h,first:"v"}}let[c,l]=vc(i,e,t,n,s,r);return Math.abs(c-i)>=Math.abs(l-e)?{kx:c,ky:e,ax:c,ay:l,first:"h"}:{kx:i,ky:l,ax:c,ay:l,first:"v"}}function ex(i,e,t,n){if(Ic(i,e,t,n))return t;let{l1:s,l2:r}=UA(i,e,t);if(n==="h"&&Math.abs(t.ky-e)<4&&r>=4){let o={...t,kx:t.ax,ky:e,first:"h"};if(Ic(i,e,o,n))return o}if(n==="v"&&Math.abs(t.kx-i)<4&&r>=4){let o={...t,kx:i,ky:t.ay,first:"v"};if(Ic(i,e,o,n))return o}return null}function tx(i,e,t,n,s,r,o,a){let c=Tc(t,n,s,r),l=So(o),h=[];OA(i,e,c)?(h=QA(i,e,c),l.leg1Axis==="h"?h=h.filter(p=>p.first==="h"):l.leg1Axis==="v"&&(h=h.filter(p=>p.first==="v"))):l.leg1Axis==="h"?h=DA(i,e,c):l.leg1Axis==="v"?h=LA(i,e,c):h=[...DA(i,e,c),...LA(i,e,c)],h=h.map(p=>({...p,_b:c}));let d=NA(i,e,h,a)||$y(i,e,t,n,s,r,l.leg1Axis),f=ex(i,e,d,l.leg1Axis);if(f)return{kx:f.kx,ky:f.ky,ax:f.ax,ay:f.ay,first:f.first};let[m,g]=vc(i,e,t,n,s,r);return{kx:m,ky:g,ax:m,ay:g,first:"straight",leaderFallback:"straight"}}function lu(i,e,t,n,s){return i==="up"||i==="down"?"v":i==="left"||i==="right"||i==="upleft"||i==="upright"||i==="downleft"||i==="downright"||Math.abs(n-e)>=Math.abs(s-t)?"h":"v"}function kA(i,e,t,n,s,r){let o={left:["h",-1],right:["h",1],up:["v",-1],down:["v",1],upleft:["h",-1],upright:["h",1],downleft:["h",-1],downright:["h",1]};return o[i]?o[i][1]:e==="h"?s>=t?1:-1:r>=n?1:-1}function nx(i,e,t,n,s){return t==="h"?[i+n*s,e]:[i,e+n*s]}function vc(i,e,t,n,s,r){let o=Tc(t,n,s,r),a=[[o.l,zt(e,o.t,o.b)],[o.r,zt(e,o.t,o.b)],[zt(i,o.l,o.r),o.t],[zt(i,o.l,o.r),o.b]],c=a[0],l=1e9;for(let h of a){let u=Math.hypot(h[0]-i,h[1]-e);u<l&&(l=u,c=h)}return c}function ix(i,e,t,n,s,r){let o=Tc(t,n,s,r),a=[];if(i>=o.l&&i<=o.r&&a.push([i,o.t],[i,o.b]),e>=o.t&&e<=o.b&&a.push([o.l,e],[o.r,e]),!a.length)return[zt(i,o.l,o.r),zt(e,o.t,o.b)];let c=a[0],l=1e9;for(let h of a){let u=Math.hypot(h[0]-i,h[1]-e);u<l&&(l=u,c=h)}return c}function sx(i,e,t,n,s){let r=So(s),o=r.leg2Axis==="h"?"h":r.leg2Axis==="v"||lu(r.dir,i,e,t,n)==="h"?"v":"h",a=r.tail>0?r.tail:Jy;return o==="h"?[t+(i>t?a:-a),n]:[t,n+(e>n?a:-a)]}function au(i,e,t,n,s,r){return[[i,e],[t,n],[s,r]]}var GA=new WeakMap;function rx(i){return i?GA.get(i):void 0}function ox(i,e){i&&e&&GA.set(i,e)}function HA(i,e,t){return i?i.vw&&i.vh?{x:i.x*e/i.vw,y:i.y*t/i.vh}:{x:i.x,y:i.y}:null}function wc(i,e,t,n,s,r={}){let o=r.minX??8,a=r.minY??66,c=r.maxY??(typeof globalThis.innerHeight=="number"?globalThis.innerHeight-n-24:900);return{x:zt(i,o,s),y:zt(e,a,c)}}function ax(i,e,t,n,s){let r=wc(i,e,t,n,s.maxX??i,s);return{cardX:r.x,cardY:r.y}}function VA(i,e,t,n,s,r,o={}){return Yy(i,e,t,n,s,r,o)}function zA(i,e,t,n,s,r,o,a={}){let c=VA(i,e,o.cardX,o.cardY,t,n,a),{cardX:l,cardY:h,degraded:u,clearance:d,panelOverlap:f,reserveRelaxed:m}=c,g=So(s),p={panelDegraded:u,panelClearance:d,panelOverlap:f,reserveRelaxed:m},A=rx(r);function I(R){let[G,N]=vc(i,e,l,h,t,n),H=Math.hypot(G-i,N-e);return H<4?{cardX:l,cardY:h,ax:G,ay:N,pts:[[i,e]],meta:{l1:0,l2:0,ang:0,leaderFallback:"hidden-overlap",leaderHidden:!0,...p}}:{cardX:l,cardY:h,ax:G,ay:N,pts:[[i,e],[G,N]],meta:{l1:H,l2:0,ang:180,leaderFallback:R||"straight",...p}}}if(g.leader==="straight"||g.leader==="line")return I(null);if(g.mode==="orthogonal"){if(f)return I("panel-overlap");let R=tx(i,e,l,h,t,n,s,A);if(R.leaderFallback==="straight"||!Ic(i,e,R,g.leg1Axis))return I("invalid-orthogonal");let{kx:G,ky:N,ax:H,ay:Y,first:z}=R,J=ou(i,e,G,N,H,Y),k=Math.hypot(G-i,N-e),te=Math.hypot(H-G,Y-N);return ox(r,z),{cardX:l,cardY:h,ax:H,ay:Y,pts:au(i,e,G,N,H,Y),meta:{kx:G,ky:N,ang:J,l1:k,l2:te,...p}}}let C=vc(i,e,l,h,t,n),E=C[0],w=C[1],v,T;if(g.mode==="leg2-lock")[v,T]=sx(i,e,E,w,s);else{let R=g.leg1Axis==="h"?"h":g.leg1Axis==="v"?"v":lu(g.dir,i,e,E,w),G=kA(g.dir,R,i,e,E,w);r!=null&&r.leaderKneeManual&&Array.isArray(r.leaderKnee)?(v=i+r.leaderKnee[0],T=e+r.leaderKnee[1]):[v,T]=nx(i,e,R,G,g.stub),[E,w]=ix(v,T,l,h,t,n)}let F=ou(i,e,v,T,E,w),M=Math.hypot(v-i,T-e),x=Math.hypot(E-v,w-T);return{cardX:l,cardY:h,ax:E,ay:w,pts:au(i,e,v,T,E,w),meta:{kx:v,ky:T,ang:F,l1:M,l2:x,...p}}}function hu(i){return!i||i.elbowMode!=="leg2-lock"?i:!i.leg2Axis&&i.leg1Axis&&i.leg1Axis!=="auto"?{...i,leg2Axis:i.leg1Axis}:i}function KA(i){return typeof i=="string"?i.trim():""}function lx(i){return i==null?"missing":typeof i=="string"?i.trim()?null:"empty":typeof i=="number"?"invalid:number":typeof i=="boolean"?"invalid:boolean":Array.isArray(i)?"invalid:array":typeof i=="object"?"invalid:object":`invalid:${typeof i}`}function hx(i){return!i||i==="empty"||i==="missing"?"(missing)":i.startsWith("invalid:")?`(invalid type: ${i.slice(8)})`:"(missing)"}function ux(i){let e=lx(i);return e?hx(e):KA(i)}function WA(i){for(let e=1;;e++){let t="h"+e;if(!i.has(t))return t}}function XA(i){let e=[];if(!Array.isArray(i)||!i.length)return e;let t=[],n=new Map;for(let o of i){if(!o||typeof o!="object"){t.push("");continue}let a=KA(o.id);t.push(a),a&&n.set(a,(n.get(a)||0)+1)}let s=new Set(n.keys()),r=new Map;for(let o=0;o<i.length;o++){let a=i[o];if(!a||typeof a!="object")continue;let c=t[o],l=ux(a.id),h=c;if(!h)h=WA(s);else{let u=(r.get(h)||0)+1;r.set(h,u),u>1&&(h=WA(s))}a.id!==h&&(e.push({index:o,from:l,to:h}),a.id=h),s.add(h)}return e}function qA(i){return i+"config.json?_="+Date.now()}function dx(i){return typeof i=="number"&&isFinite(i)&&i>0?i:null}function bc(i,e){for(let t of i){let n=dx(t);if(n!=null)return n}return e}function uu(i,e,t){var n,s,r,o,a,c,l;return bc([(n=t==null?void 0:t.configTimeoutMs)==null?void 0:n.call(t),(s=t==null?void 0:t.configTimeout)==null?void 0:s.call(t),e==null?void 0:e.configTimeoutMs,e==null?void 0:e.configTimeout,(r=i==null?void 0:i.performance)==null?void 0:r.configTimeoutMs,(o=i==null?void 0:i.performance)==null?void 0:o.configTimeout,e==null?void 0:e.bootTimeoutMs,e==null?void 0:e.bootTimeout,(a=i==null?void 0:i.performance)==null?void 0:a.bootTimeoutMs,(c=i==null?void 0:i.performance)==null?void 0:c.bootTimeout,(l=t==null?void 0:t.bootTimeoutMs)==null?void 0:l.call(t)],12e3)}function YA(i,e,t){var n,s,r,o;return bc([(n=t==null?void 0:t.modelIdleTimeoutMs)==null?void 0:n.call(t),(s=t==null?void 0:t.modelIdleTimeout)==null?void 0:s.call(t),e==null?void 0:e.modelIdleTimeoutMs,e==null?void 0:e.modelIdleTimeout,(r=i==null?void 0:i.performance)==null?void 0:r.modelIdleTimeoutMs,(o=i==null?void 0:i.performance)==null?void 0:o.modelIdleTimeout],2e4)}function JA(i,e,t){var n,s,r,o;return bc([(n=t==null?void 0:t.modelTotalTimeoutMs)==null?void 0:n.call(t),(s=t==null?void 0:t.modelTotalTimeout)==null?void 0:s.call(t),e==null?void 0:e.modelTotalTimeoutMs,e==null?void 0:e.modelTotalTimeout,(r=i==null?void 0:i.performance)==null?void 0:r.modelTotalTimeoutMs,(o=i==null?void 0:i.performance)==null?void 0:o.modelTotalTimeout],12e4)}function ZA(i,e,t){var n,s,r,o;return bc([(n=t==null?void 0:t.panoramaRevealTimeoutMs)==null?void 0:n.call(t),(s=t==null?void 0:t.panoramaRevealTimeout)==null?void 0:s.call(t),e==null?void 0:e.panoramaRevealTimeoutMs,e==null?void 0:e.panoramaRevealTimeout,(r=i==null?void 0:i.performance)==null?void 0:r.panoramaRevealTimeoutMs,(o=i==null?void 0:i.performance)==null?void 0:o.panoramaRevealTimeout],8e3)}var du=2048;function jA(i,e,t=0){var s;if(typeof t=="number"&&t>0)return t;if(!e)return 0;let n=(s=i==null?void 0:i.performance)==null?void 0:s.strictWebKitPanoramaMaxWidth;return typeof n=="number"&&n>0?n:du}var fx=1.5,Ax=2;function $A({isMobile:i,strictWebKit:e,devicePixelRatio:t,cfg:n}){var h;let s=(u,d)=>typeof u=="number"&&isFinite(u)&&u>0?u:d,r=n==null?void 0:n.performance,o=s((h=n==null?void 0:n.renderer)==null?void 0:h.maxPixelRatio,2),a=i?s(r==null?void 0:r.mobilePixelRatio,1.5):s(r==null?void 0:r.desktopPixelRatio,o),c=!0;if(e){let u=s(r==null?void 0:r.strictWebKitPixelRatio,fx);a=Math.min(u,o,Ax),i&&(c=(r==null?void 0:r.strictWebKitAntialias)===!0)}return{pixelRatio:Math.min(s(t,1),a),antialias:c}}function ep({idleMs:i,totalMs:e,onIdle:t,onTotal:n,onDownloadComplete:s}){let r=0,o=0,a=-1,c=!1,l=!1,h=()=>{r&&clearTimeout(r),r=0},u=()=>{h(),o&&clearTimeout(o),o=0},d=()=>{c||l||(h(),r=setTimeout(()=>{t==null||t()},i))},f=()=>{c||(c=!0,h(),s==null||s())};return{start:()=>{u(),a=-1,c=!1,l=!1,o=setTimeout(()=>{n==null||n()},e)},progress:(p,A)=>{if(typeof p!="number")return;let I=typeof A=="number"&&A>0;if(!I){l=!0,h(),p>a&&(a=p);return}if(l=!1,I&&p>=A){p>a&&(a=p),f();return}p>a&&(a=p,d())},clear:u,isDownloadComplete:()=>c,isLengthUnknown:()=>l}}function tp({width:i,height:e,fovDeg:t,aspect:n,fill:s}){let r=typeof s=="number"&&s>0?s:1,o=typeof n=="number"&&n>0?n:1,a=Math.tan((t||40)*Math.PI/360);if(!(a>0))return null;let c=a*o,l=Math.max(e,0)/2/a/r,h=Math.max(i,0)/2/c/r,u=Math.max(l,h);return u>0?u:null}var px=.78;function np(i){var t;let e=(t=i==null?void 0:i.camera)==null?void 0:t.portraitFill;return e===!1||e===0?0:typeof e=="number"&&e>0?Math.min(e,.98):px}function ip(i,e){return typeof i=="number"&&i>0&&i<1&&e>0}var fu=["key","fill","rim","bounce"],Dc={ambient:{color:"#ffffff",intensity:.25},key:{color:"#fff0e0",intensity:1.1,position:[5,8,6]},fill:{color:"#a9c4ff",intensity:.35,position:[-5,2,-3]},rim:{color:"#ffffff",intensity:.5,position:[-2,3,-7]},bounce:{color:"#fff4e6",intensity:.3,position:[3.69,-8.19,4.39]}},mx=new Set(["bounce"]);var Jn="key",Bc={enabled:!1,opacity:.32,softness:3,groundOffset:0,plate:!0,plateColor:"#2b2f3a"},gx=/^#[0-9a-fA-F]{6}$/,vo={room:{label:"\u5185\u7F6E\u623F\u95F4",builtin:!0},studio:{label:"\u5F71\u68DA\u67D4\u5149",sky:"#3a3d45",ground:"#15161a",horizon:"#26282e",spots:[{u:.25,v:.14,r:.3,i:3.2,c:"#ffffff"},{u:.75,v:.22,r:.26,i:1.5,c:"#eef2ff"},{u:.5,v:.04,r:.4,i:1.1,c:"#ffffff"}]},gallery:{label:"\u535A\u7269\u9986\u6696\u9601",sky:"#2a231c",ground:"#0d0b09",horizon:"#1a1512",spots:[{u:.5,v:.1,r:.2,i:3.6,c:"#ffe6c2"},{u:.12,v:.26,r:.16,i:1.2,c:"#ffd8a8"},{u:.86,v:.26,r:.16,i:1,c:"#ffe9cf"}]},overcast:{label:"\u6237\u5916\u9634\u5929",sky:"#c8d2dc",ground:"#6e7379",horizon:"#9aa3ac",spots:[{u:.5,v:.06,r:.55,i:1.35,c:"#ffffff"}]},night:{label:"\u591C\u5C55\u6697\u573A",sky:"#0d0f16",ground:"#050607",horizon:"#0a0b11",spots:[{u:.3,v:.16,r:.14,i:2.2,c:"#cfe0ff"},{u:.72,v:.2,r:.12,i:1.4,c:"#ffd9b0"}]}},ZS=Object.keys(vo);function Gi(i={}){let e=i.environment||{};if(e.mode==="panorama"&&i.assets&&i.assets.panorama)return{kind:"panorama",url:i.assets.panorama};let t=vo[e.preset]?e.preset:"room";return t==="room"?{kind:"room"}:{kind:"preset",preset:t}}var sp=180/Math.PI,Rc=(i,e,t)=>Math.min(t,Math.max(e,i)),ki=(i,e)=>typeof i=="number"&&isFinite(i)?i:e,rp=i=>Math.round(i*10)/10,_x=i=>Math.round(i*1e3)/1e3;function Au(i){var t;let e=(t=Dc[i])==null?void 0:t.position;return e?e.slice():[3,5,4]}function Ex(i){var e;return ki((e=Dc[i])==null?void 0:e.intensity,.4)}function op(i,e){return i&&typeof i.enabled=="boolean"?i.enabled:!mx.has(e)}function Lc(i,e){return op(e,i)?ki(e&&e.intensity,Ex(i)):0}function Pc(i={}){let e=i.shadow||{};return{enabled:e.enabled===!0,opacity:Rc(ki(e.opacity,Bc.opacity),0,1),softness:Rc(ki(e.softness,Bc.softness),0,10),groundOffset:Rc(ki(e.groundOffset,Bc.groundOffset),-1,1),plate:e.plate!==!1,plateColor:gx.test(e.plateColor)?e.plateColor:Bc.plateColor}}function ap(i={}){if(!Pc(i).enabled)return!1;let t=(i.lights||{})[Jn];return!op(t,Jn)||Lc(Jn,t)<=0?!1:yx(t&&t.position?t.position:Au(Jn)).elevation>3}function yx(i){let e=Array.isArray(i)?i:[],t=ki(e[0],0),n=ki(e[1],0),s=ki(e[2],0),r=Math.hypot(t,n,s);return r<1e-6?{azimuth:0,elevation:0,radius:0}:{azimuth:rp(Math.atan2(t,s)*sp),elevation:rp(Math.asin(Rc(n/r,-1,1))*sp),radius:_x(r)}}function cp(){let i=0;return{next(){return++i},invalidate(){return i+=1,i},isCurrent(e){return e===i}}}function pu(i){return String(i||"").toLowerCase()}function lp(i,e){let t=pu(e),n=i||[],s=n.find(a=>pu(a.namePattern)===t);if(s)return s;let r=null,o=0;for(let a of n){let c=pu(a.namePattern);!c||!t.includes(c)||c.length>o&&(r=a,o=c.length)}return r}function hp(i,e){!i||!e||(typeof e.roughness=="number"&&(i.roughness=e.roughness),typeof e.metalness=="number"&&(i.metalness=e.metalness),typeof e.envMapIntensity=="number"&&(i.envMapIntensity=e.envMapIntensity))}var xx="https://cdn.yunmanvr.com/exhibits";function up(i,e,t=xx){if(typeof i!="string"||!i)return i;let n=String(t||"").replace(/\/+$/,"");if(!n||!i.startsWith(`${n}/`))return i;let s;try{s=decodeURIComponent(i.slice(n.length+1))}catch{s=i.slice(n.length+1)}let r=String(e||"").replace(/^\/+|\/+$/g,"");return r&&s.startsWith(`${r}/`)?s.slice(r.length+1):/^craft-\d+\//.test(s)?i:s?`../${s}`:i}window.__SY_PLAYER=window.__SY_PLAYER||{};window.__SY_PLAYER.module=!0;var ne=i=>document.getElementById(i),ws=new URLSearchParams(location.search),vn=!1,Iu=(ws.get("ex")||"").replace(/^\/+|\/+$/g,""),Su=Iu?Iu+"/":"",Fs=i=>!i||/^(https?:|data:|blob:|\/\/|\/)/.test(i)?i:Su+i;function Vc(i){let e=up(i,Iu);if(!e||e===i)return"";let t=Fs(e);return t&&t!==i?t:""}function yp(i,e,t){let n=Vc(i),s=new as;s.load(i,e,void 0,()=>{if(n&&n!==i){s.load(n,e,void 0,t);return}t()})}function Cx(i){let e=Fs(i);if(!e)return;let t=ne("poster");t.style.backgroundImage=`url("${e}")`,t.classList.add("on");let n=Vc(i);if(!n||n===e)return;let s=new Image;s.onerror=()=>{t.style.backgroundImage=`url("${n}")`},s.src=e}var Mx=matchMedia("(prefers-reduced-motion: reduce)").matches;function Ix(){let i=navigator.userAgent||"";return!!(/MicroMessenger/i.test(i)||/iPhone|iPad|iPod/i.test(i)||/Safari/i.test(i)&&!/Chrome|CriOS|Chromium|Edg|OPR|FxiOS|UCBrowser|Quark|360/i.test(i))}var Br=Ix();function Sx(i){let e=ws.get(i);return e==="1"||e==="true"?!0:e==="0"||e==="false"?!1:null}var vu=Sx("panoDefer"),Lo=vu!==null?vu:Br,qt={enabled:ws.get("syDiag")==="1",urlMaxWidth:Math.max(0,parseInt(ws.get("panoMax")||"0",10)||0),skipPmrem:ws.get("panoPmrem")==="0",skipVisibleBg:ws.get("panoBg")==="0",loadOnly:ws.get("panoLoadOnly")==="1"};function vx(){return qt.skipPmrem||qt.loadOnly?0:jA(j,Br,qt.urlMaxWidth)}window.__SY_PANO_DIAG__=window.__SY_PANO_DIAG__||[];function Xt(i,e){if(!qt.enabled)return;let t={t:Date.now(),tag:i,detail:e??null};window.__SY_PANO_DIAG__.push(t),console.log("[pano-diag]",i,e??"");let n=document.getElementById("sy-pano-diag");n||(n=document.createElement("pre"),n.id="sy-pano-diag",n.style.cssText="position:fixed;left:0;bottom:0;right:0;max-height:32vh;overflow:auto;font:10px/1.35 ui-monospace,monospace;background:rgba(0,0,0,.78);color:#9f9;z-index:99999;margin:0;padding:6px 8px;pointer-events:none;white-space:pre-wrap;",document.body.appendChild(n)),n.textContent=window.__SY_PANO_DIAG__.slice(-28).map(s=>{let r=s.detail!=null?" "+JSON.stringify(s.detail):"";return s.tag+r}).join(`
`)}function Tx(i,e){let t=i.image;if(!e||!(t!=null&&t.width)||t.width<=e)return i;let n=e,s=Math.max(1,Math.round(t.height*(n/t.width))),r=document.createElement("canvas");r.width=n,r.height=s,r.getContext("2d").drawImage(t,0,0,n,s);let o=new Li(r);return o.mapping=i.mapping,o.colorSpace=i.colorSpace,i.image=null,i.dispose(),o}function wx(i){var r,o,a,c,l,h,u,d,f,m,g;let e={w:(r=i.image)==null?void 0:r.width,h:(o=i.image)==null?void 0:o.height};Xt("pano:texture-loaded",e);let t=vx();if(t>0){let p=e;i=Tx(i,t),((a=i.image)==null?void 0:a.width)!==p.w&&Xt("pano:downscaled",{w:i.image.width,h:i.image.height,maxWidth:t})}if(qt.loadOnly){Xt("pano:load-only-done",e),i.dispose();return}if(qt.skipPmrem){Xt("pano:skip-pmrem",{keepVisibleBg:!qt.skipVisibleBg&&!!((c=j.environment)!=null&&c.visibleBackground)}),!qt.skipVisibleBg&&((l=j.environment)!=null&&l.visibleBackground)?(Kt&&Kt!==i&&Kt.dispose(),Kt=i,ft.background=i):i.dispose();return}Xt("pano:pmrem-start",{w:(h=i.image)==null?void 0:h.width,h:(u=i.image)==null?void 0:u.height});let n;try{n=Fu().fromEquirectangular(i)}catch(p){Xt("pano:pmrem-fail",{message:(p==null?void 0:p.message)||String(p)}),!qt.skipVisibleBg&&((d=j.environment)!=null&&d.visibleBackground)?(Kt&&Kt!==i&&Kt.dispose(),Kt=i,ft.background=i):i.dispose(),Ou();return}Xt("pano:pmrem-done",{w:(f=i.image)==null?void 0:f.width,h:(m=i.image)==null?void 0:m.height});let s=!qt.skipVisibleBg&&((g=j.environment)==null?void 0:g.visibleBackground);Uu(n,s?i:null),s||i.dispose()}qt.enabled&&Xt("pano:boot",{strictWebKit:Br,deferPanoramaIBL:Lo,panoDeferOverride:vu,urlMaxWidth:qt.urlMaxWidth,strictWebKitPanoMaxDefault:Br?du:0,skipPmrem:qt.skipPmrem,skipVisibleBg:qt.skipVisibleBg,loadOnly:qt.loadOnly});var Ru="zh",j,$e,ft,mt,He,Nt,Ei=[],No=null,bx=0,Du=null,Po=new b,bs=new b,Bs=new Ft,Rs=new b,Zn=[],Rr=-1,Fc=!1,wo=!1,Dr=i=>i&&(i[Ru]||i.zh||i.en)||{};function Bx(i,e){let t=String(i||"").replace("#",""),n=t.length===3?t.split("").map(a=>a+a).join(""):t,s=parseInt(n.slice(0,2),16),r=parseInt(n.slice(2,4),16),o=parseInt(n.slice(4,6),16);return[s,r,o].some(a=>isNaN(a))?`rgba(200,168,106,${e})`:`rgba(${s},${r},${o},${e})`}function Rx(i,e){ne("loading").setAttribute("hidden",""),ne("err-text").textContent=i,ne("err-btn").toggleAttribute("hidden",!e),ne("error").removeAttribute("hidden")}function Ds(i,e=!0){window.__SY_PLAYER.failed=!0,++bo,++On,clearTimeout(Fo),Rx(i,e)}var at=(i,e)=>typeof i=="number"&&isFinite(i)?i:e;function xp(i){let e=i&&i.position;if(e==null||e==="")return[0,0,0];if(!Array.isArray(e)||e.length<3)return null;let t=at(e[0],NaN),n=at(e[1],NaN),s=at(e[2],NaN);return[t,n,s].every(Number.isFinite)?[t,n,s]:null}var Fo=0,bo=0,On=0;function Dx(){window.__SY_PLAYER.ready=!0,clearTimeout(Fo)}function Tu(i){Ds(i,!0)}function Lx(i){clearTimeout(Fo),Fo=setTimeout(()=>{window.__SY_PLAYER.ready||window.__SY_PLAYER.failed||i===bo&&Tu("\u914D\u7F6E\u52A0\u8F7D\u8D85\u65F6\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5")},uu(null,window.__SY_PLAYER,null))}async function Px(i,e){let t=new AbortController,n=setTimeout(()=>t.abort(),e);try{return await fetch(i,{cache:"no-cache",signal:t.signal})}finally{clearTimeout(n)}}function Fx(){var t;let i=matchMedia("(pointer:coarse)").matches||innerWidth<768,e=$A({isMobile:i,strictWebKit:Br,devicePixelRatio:window.devicePixelRatio||1,cfg:j});try{$e=new fc({canvas:ne("scene"),antialias:e.antialias,powerPreference:Br?"default":"high-performance",preserveDrawingBuffer:vn})}catch{return!1}if($e.setPixelRatio(e.pixelRatio),$e.setSize(innerWidth,innerHeight),qt.enabled){let n=$e.capabilities;Xt("webgl:capabilities",{maxTextureSize:n.maxTextureSize,maxCubemapSize:n.maxCubemapSize,dpr:e.pixelRatio,isMobile:i,antialias:e.antialias}),$e.domElement.addEventListener("webglcontextlost",s=>{Xt("webgl:context-lost",{type:s.type})},!1),$e.domElement.addEventListener("webglcontextrestored",()=>{Xt("webgl:context-restored",{}),ft&&j&&(Wc(),Ls(),Nt&&wu())},!1)}return $e.toneMapping=Na,$e.toneMappingExposure=at((t=j.renderer)==null?void 0:t.exposure,1.05),$e.outputColorSpace=et,$e.shadowMap.type=ba,$e.shadowMap.autoUpdate=!1,bu=i?512:1024,!0}function Ux(i){var l,h,u,d;i.scale.setScalar(1),i.position.set(0,0,0),i.rotation.set(0,0,0),i.updateMatrixWorld(!0);let t=new Ft().setFromObject(i).getSize(new b),n=Math.max(t.x,t.y,t.z)||1,s=at((l=j.model)==null?void 0:l.targetSize,2.6)/n*at((h=j.model)==null?void 0:h.scale,1);i.scale.setScalar(s),i.updateMatrixWorld(!0);let o=new Ft().setFromObject(i).getCenter(new b),a=((u=j.model)==null?void 0:u.position)||[0,0,0];i.position.set(-o.x+(a[0]||0),-o.y+(a[1]||0),-o.z+(a[2]||0));let c=((d=j.model)==null?void 0:d.rotationDeg)||[0,0,0];i.rotation.set(c[0]*Math.PI/180,c[1]*Math.PI/180,c[2]*Math.PI/180),i.updateMatrixWorld(!0),Bs.setFromObject(i),Mp(),$e&&$e.shadowMap.enabled&&($e.shadowMap.needsUpdate=!0)}function wu(){var t,n;let i=((t=j.materials)==null?void 0:t.global)||{},e=((n=j.materials)==null?void 0:n.overrides)||[];Nt.traverse(s=>{s.isMesh&&[].concat(s.material).forEach(r=>{!r||!("roughness"in r)||(typeof i.roughness=="number"&&(r.roughness=i.roughness),typeof i.metalness=="number"&&(r.metalness=i.metalness),typeof i.envMapIntensity=="number"&&(r.envMapIntensity=i.envMapIntensity),hp(r,lp(e,r.name)),r.needsUpdate=!0)})})}function Nx(){Nt&&Nt.traverse(i=>{i.isMesh&&[].concat(i.material).forEach(e=>{!e||!("roughness"in e)||("envMap"in e&&(e.envMap=null),e.needsUpdate=!0)})})}var Vi={},Hi=null,bu=1024,Wt=null,jn=null;function Oc(){var t;Object.values(Vi).forEach(n=>n.parent&&n.parent.remove(n)),Vi={},Hi&&ft.remove(Hi),Hi=new fn,ft.add(Hi);let i=j.lights||{},e=new Ao(new Ee(((t=i.ambient)==null?void 0:t.color)||"#ffffff"),Lc("ambient",i.ambient));ft.add(e),Vi.ambient=e,fu.forEach(n=>{let s=i[n]||{},r=new us(new Ee(s.color||Dc[n].color),Lc(n,s)),o=s.position||Au(n);r.position.set(o[0],o[1],o[2]),n===Jn&&(r.shadow.mapSize.set(bu,bu),r.shadow.bias=-6e-4,r.shadow.normalBias=.02),Hi.add(r),Vi[n]=r}),Cp(),Uo()}function Cp(){if(!Hi)return;let e=!!(j.lights&&j.lights.followCamera)&&mt&&He?Math.atan2(mt.position.x-He.target.x,mt.position.z-He.target.z):0;Hi.rotation.y!==e&&(Hi.rotation.y=e,$e&&$e.shadowMap.enabled&&($e.shadowMap.needsUpdate=!0))}function Ox(){let e=document.createElement("canvas");e.width=e.height=256;let t=e.getContext("2d"),n=t.createRadialGradient(256/2,256/2,0,256/2,256/2,256/2);n.addColorStop(0,"rgba(0,0,0,1)"),n.addColorStop(.45,"rgba(0,0,0,0.72)"),n.addColorStop(.75,"rgba(0,0,0,0.22)"),n.addColorStop(1,"rgba(0,0,0,0)"),t.fillStyle=n,t.fillRect(0,0,256,256);let s=new Li(e);return s.colorSpace=et,s}function Qx(){let e=document.createElement("canvas");e.width=e.height=256;let t=e.getContext("2d"),n=t.createRadialGradient(256/2,256/2,0,256/2,256/2,256/2);return n.addColorStop(0,"#ffffff"),n.addColorStop(.55,"#ffffff"),n.addColorStop(.82,"#6a6a6a"),n.addColorStop(1,"#000000"),t.fillStyle=n,t.fillRect(0,0,256,256),new Li(e)}function dp(i){if(i){ft.remove(i),i.geometry.dispose();for(let e of["map","alphaMap"])i.material[e]&&i.material[e].dispose();i.material.dispose()}}function kx(){dp(Wt),dp(jn),Wt=jn=null}function fp(i){return i.plate?new Cn({color:new Ee(i.plateColor),roughness:.95,metalness:0,transparent:!0,alphaMap:Qx(),depthWrite:!1}):new co({transparent:!0,depthWrite:!1})}function Uo(){if(!$e||!ft)return;let i=Pc(j),e=ap(j);if($e.shadowMap.enabled=i.enabled,Object.entries(Vi).forEach(([n,s])=>{s.castShadow=e&&n===Jn}),Vi[Jn]&&(Vi[Jn].shadow.radius=i.softness),Nt&&Nt.traverse(n=>{n.isMesh&&(n.castShadow=i.enabled)}),!i.enabled){kx();return}if(Wt||(Wt=new Xe(new ar(.5,64),fp(i)),Wt.rotation.x=-Math.PI/2,Wt.receiveShadow=!0,Wt.renderOrder=-2,ft.add(Wt),jn=new Xe(new ar(.5,64),new en({map:Ox(),transparent:!0,depthWrite:!1})),jn.rotation.x=-Math.PI/2,jn.renderOrder=-1,ft.add(jn)),!!Wt.material.isMeshStandardMaterial!==i.plate){let n=Wt.material;Wt.material=fp(i),n.alphaMap&&n.alphaMap.dispose(),n.dispose()}else i.plate&&Wt.material.color.set(i.plateColor);Wt.material.opacity=i.plate?1:i.opacity,jn.material.opacity=Math.min(1,i.opacity*.85),Mp(i),$e.shadowMap.needsUpdate=!0}function Mp(i){if(!Wt||!Nt)return;let e=i||Pc(j),t=Bs.getSize(new b),n=Bs.getCenter(new b),s=Math.max(t.x,t.z,.1),r=Bs.min.y+e.groundOffset;Wt.scale.set(s*6,s*6,1),Wt.position.set(n.x,r,n.z),jn&&(jn.scale.setScalar(s*(1.7+e.softness*.06)),jn.position.set(n.x,r+.002,n.z));let o=Vi[Jn];if(!o)return;let a=Math.max(t.x,t.y,t.z,.1)*.9,c=o.shadow.camera;c.left=-a,c.right=a,c.top=a,c.bottom=-a,c.near=.1,c.far=o.position.length()+a*2,c.updateProjectionMatrix()}function Ip(){let i=j.camera||{},e=np(j),t=innerHeight>0?innerWidth/innerHeight:1;if(!ip(t,e)||!Nt)return null;let n=Bs.getSize(new b);if(!(n.y>0))return null;let s=tp({width:Math.max(n.x,n.z),height:n.y,fovDeg:at(i.fov,40),aspect:t,fill:e});return s?Math.min(Math.max(s,at(i.minDistance,1.4)),at(i.maxDistance,7)):null}function Gx(){let i=j.camera||{};mt.fov=at(i.fov,40),mt.updateProjectionMatrix();let e=i.pivot||[0,0,0];Rs.set(e[0]||0,e[1]||0,e[2]||0),mt.position.setFromSpherical(new Kn(Ip()??at(i.distance,3.4),at(i.phi,1.2),at(i.theta,.7))),mt.position.add(Rs),Po.copy(mt.position),He.target.copy(Rs),He.minDistance=at(i.minDistance,1.4),He.maxDistance=at(i.maxDistance,7),He.autoRotate=!Mx&&i.autoRotate!==!1,He.autoRotateSpeed=at(i.autoRotateSpeed,.9),He.update()}function Hx(i){let e=Po.clone().sub(Rs);if(e.lengthSq()===0){let t=j.camera||{};e.setFromSpherical(new Kn(i,at(t.phi,1.2),at(t.theta,.7)))}else e.setLength(i);Po.copy(Rs).add(e)}function Vx(){He&&(He._sphericalDelta.set(0,0,0),He._panOffset.set(0,0,0))}function zx(){var t;if(!mt||!He||!Nt)return;let i=Ip()??at((t=j.camera)==null?void 0:t.distance,3.4),e=mt.position.clone().sub(He.target);e.lengthSq()===0&&e.set(0,0,1),e.setLength(i),mt.position.copy(He.target).add(e),Hx(i),Vx(),He.update()}var Wx=720;function Sp(){return vn&&innerWidth<=Wx}function Kx(){window.__edPanelUserToggled=!0,vp(!document.body.classList.contains("ed-panel-collapsed"))}function Lu(){let i=document.querySelector("[data-k=editPanel]");if(!i)return;let e=Sp(),t=document.body.classList.contains("ed-panel-collapsed");if(i.hidden=!e||!t,!e)return;i.classList.toggle("on",!1),i.setAttribute("aria-pressed",t?"false":"true"),i.setAttribute("aria-expanded",t?"false":"true");let n=i.querySelector(".tx");n&&(n.textContent=Bu.editPanel[Ru])}function vp(i){vn&&(document.body.classList.toggle("ed-panel-collapsed",i),Lu())}function Xx(){if(!vn)return;let i=Sp();document.body.classList.toggle("ed-narrow",i),i||document.body.classList.remove("ed-panel-collapsed"),i&&!window.__edPanelUserToggled?vp(!0):Lu()}function Ls(){var i,e;ft&&(ft.environmentIntensity=at((i=j.environment)==null?void 0:i.intensity,1),ft.environmentRotation.y=at((e=j.environment)==null?void 0:e.rotationDeg,0)*Math.PI/180)}var mu=null,Qc=null,Kt=null,vr=cp(),Bo="",ln=null,Ps=null,Qn=null,qx=!1,Yx=null;function Pu(){ln=null}function To(i){(ln==null?void 0:ln.url)===i&&(ln=null)}function Fu(){return mu||(mu=new yr($e)),mu}function Uu(i,e){var n,s;if(!ft)return;let t=Qc;Qc=i,ft.environment=i?i.texture:null,Kt&&Kt!==e&&Kt.dispose(),Kt=e||null,ft.background=(n=j.environment)!=null&&n.visibleBackground&&Kt?Kt:new Ee(((s=j.renderer)==null?void 0:s.background)||"#0f1118"),Nx(),t&&t!==i&&t.dispose()}function zc(){vr.invalidate(),Pu();let i=new Cc;Uu(Fu().fromScene(i,.04),null),i.dispose()}var Jx=i=>{let e=parseInt(String(i).slice(1),16);return[e>>16&255,e>>8&255,e&255]};function Zx(i){let n=document.createElement("canvas");n.width=512,n.height=256;let s=n.getContext("2d"),r=s.createLinearGradient(0,0,0,256);r.addColorStop(0,i.sky),r.addColorStop(.5,i.horizon),r.addColorStop(1,i.ground),s.fillStyle=r,s.fillRect(0,0,512,256),s.globalCompositeOperation="lighter";for(let a of i.spots){let c=a.r*256,l=a.v*256,[h,u,d]=Jx(a.c),f=Math.max(1,Math.round(a.i)),m=a.i/f,g=[a.u*512];a.u*512-c<0&&g.push(a.u*512+512),a.u*512+c>512&&g.push(a.u*512-512);for(let p of g){let A=s.createRadialGradient(p,l,0,p,l,c);A.addColorStop(0,`rgba(${h},${u},${d},${m})`),A.addColorStop(1,`rgba(${h},${u},${d},0)`),s.fillStyle=A;for(let I=0;I<f;I++)s.beginPath(),s.arc(p,l,c,0,Math.PI*2),s.fill()}}let o=new Li(n);return o.mapping=Ni,o.colorSpace=et,o}function Nu(i){vr.invalidate(),Pu();let e=vo[i];if(!e||e.builtin)return zc();let t=Zx(e);Uu(Fu().fromEquirectangular(t),t)}function jx(){var e;let i=(e=j.environment)==null?void 0:e.preset;return vo[i]?i:"room"}function Ou(){vr.invalidate(),Pu();let i=jx();i==="room"?zc():Nu(i)}function $x(i){j.assets=j.assets||{},j.assets.panorama=i,j.environment=j.environment||{},j.environment.mode="panorama"}function eC(i){if(!i)return Promise.resolve(null);if((Qn==null?void 0:Qn.url)===i)return Qn.promise;Xt("pano:prefetch-start",{url:i});let e=new Promise((t,n)=>{yp(i,s=>{var r,o;s.mapping=Ni,s.colorSpace=et,Xt("pano:prefetch-done",{w:(r=s.image)==null?void 0:r.width,h:(o=s.image)==null?void 0:o.height}),t(s)},n)});return Qn={url:i,promise:e},e}function tC(i,e={}){if(!i)return Promise.reject(new Error("empty panorama url"));let{commitUrl:t=null}=e;if((ln==null?void 0:ln.url)===i)return t!=null&&(ln.commitUrl=t),ln.promise;let n=vr.next(),s=i,r={url:i,commitUrl:t,promise:null};return r.promise=new Promise((o,a)=>{let c=u=>{if(!vr.isCurrent(n)){u.dispose(),To(s),o({stale:!0});return}r.commitUrl!=null&&$x(r.commitUrl);let d=Gi(j);if(d.kind!=="panorama"||Fs(d.url)!==s){u.dispose(),To(s),o({stale:!0});return}u.mapping=Ni,u.colorSpace=et;let f=Bo===s;Bo="",To(s),wx(u),f&&typeof window.__edRefresh=="function"&&window.__edRefresh(),o({stale:!1})},l=()=>{if(!vr.isCurrent(n)){To(s),o({stale:!0});return}To(s),Bo=s,Ou(),typeof window.__edRefresh=="function"&&window.__edRefresh(),r.commitUrl!=null?a(new Error("panorama load failed")):o({stale:!0})};if(vn&&qx){Yx={entry:r,token:n,expectedUrl:s,finishOk:c,finishErr:l,resolve:o,reject:a};return}let h=(Qn==null?void 0:Qn.url)===s?Qn:null;if(h){Qn=null,h.promise.then(u=>c(u)).catch(l);return}yp(i,c,l)}),ln=r,r.promise}function nC(){let i=Gi(j);i.kind==="preset"?Nu(i.preset):zc()}function kc(){let i=Gi(j);if(i.kind!=="panorama")return Promise.resolve({kind:"skip"});let e=Fs(i.url);return Bo&&e===Bo?(Ou(),Promise.resolve({kind:"fallback"})):(Xt("pano:kick",{url:e,deferPanoramaIBL:Lo}),(!Ps||(ln==null?void 0:ln.url)!==e)&&(Ps=tC(e).then(t=>({kind:"panorama",...t}))),Ps)}async function iC(i){if(Gi(j).kind!=="panorama"||(Lo?kc():Ps||kc(),!Ps))return;ne("load-text").textContent="\u6B63\u5728\u51C6\u5907\u73AF\u5883\u5149\u7167\u2026",ne("bar").style.width="100%";let t=ZA(j,window.__SY_PLAYER,null);Xt("pano:await-before-reveal",{deferPanoramaIBL:Lo,capMs:t});let n=0,s=await Promise.race([Ps.then(()=>"env"),new Promise(r=>{n=setTimeout(()=>r("timeout"),t)})]);clearTimeout(n),s==="timeout"&&Xt("pano:await-timeout",{capMs:t}),i!==On||window.__SY_PLAYER.ready}function Wc(){let i=Gi(j);i.kind==="panorama"?kc():i.kind==="preset"?Nu(i.preset):zc()}function Tp(){var e,t;let i=!!((e=j.environment)!=null&&e.visibleBackground);i&&Kt?ft.background=Kt:i?Wc():ft.background=new Ee(((t=j.renderer)==null?void 0:t.background)||"#0f1118")}var sC=["solid","glass","transparent","outline","ribbon","minimal"];function rC(i){let e=ne("card");sC.forEach(t=>e.classList.remove("st-"+t)),e.classList.add("st-"+(i||"solid"))}function wp(){let i=innerWidth>720,e=Yt;yi=setTimeout(()=>{yi=null,Yt===e&&ne("card").classList.add("show")},i?240:60)}function oC(){let i=(Yt==null?void 0:Yt.data)??null,e=(i==null?void 0:i.id)??null,t=i!=null,n=ne("card").classList.contains("show");clearTimeout(yi),yi=null,Yt=null;let s=ne("hs-layer");if(s.innerHTML="",Ei.forEach(a=>{a.anchor&&a.anchor.parent&&a.anchor.parent.remove(a.anchor)}),Ei=[],!Nt)return;let r=j.hotspotStyle||{};(j.hotspots||[]).forEach(a=>{let c=document.createElement("div");c.className="hs";let l=a.color||r.color||"#c8a86a";c.style.setProperty("--hs-color",l),c.style.setProperty("--hs-glow",Bx(l,.55)),r.size&&c.style.setProperty("--hs-size",r.size+"px"),r.pulse===!1&&c.classList.add("no-pulse"),c.setAttribute("role","button"),c.setAttribute("tabindex","0"),c.setAttribute("aria-label",(Dr(a.i18n).title||"\u70ED\u70B9")+" \xB7 \u67E5\u770B\u8BB2\u89E3"),s.appendChild(c);let h=xp(a);if(!h)throw new Error("invalid hotspot position");let u=new ut;u.position.copy(Nt.worldToLocal(new b(...h))),Nt.add(u);let d={data:a,el:c,anchor:u};vn?c.addEventListener("pointerdown",f=>startHsDrag(f,d)):(c.addEventListener("click",f=>{f.stopPropagation(),pp(a,c)}),c.addEventListener("keydown",f=>{(f.key==="Enter"||f.key===" ")&&(f.preventDefault(),pp(a,c))})),Ei.push(d)});let o=null;i&&(o=Ei.find(a=>a.data===i),!o&&e&&(o=Ei.find(a=>{var c;return((c=a.data)==null?void 0:c.id)===e}))),o?(Yt=o,o.el.classList.add("active"),n?(innerWidth>720&&ne("hs-svg").removeAttribute("hidden"),mC()):wp()):t&&ku({refocus:!1})}var Tr=!0,Uc=new b;function aC(){let i=new b;Ei.forEach(e=>{e.anchor.getWorldPosition(Uc),bs.copy(Uc).project(mt);let t=bs.z<1,n=(bs.x*.5+.5)*innerWidth,s=(-bs.y*.5+.5)*innerHeight;i.copy(mt.position).sub(Uc).normalize();let r=Uc.clone().normalize().dot(i),o=r>.12?1:r>-.15?.28:0;(!Tr||!t)&&(o=0),e.el.style.opacity=o;let a=o>.5;e.el.style.pointerEvents=a?"auto":"none",e._vis!==a&&(e._vis=a,e.el.tabIndex=a?0:-1,e.el.setAttribute("aria-hidden",a?"false":"true")),e.el.style.left=n+"px",e.el.style.top=s+"px"})}var Ap=null,Yt=null,Qu=0,yi=null;function pp(i,e){var o;clearTimeout(yi),yi=null,He.autoRotate=!1,wr(),Ei.forEach(a=>a.el.classList.toggle("active",a.el===e)),Yt=Ei.find(a=>a.el===e);let t=Dr(i.i18n);ne("card-title").textContent=t.title||"",ne("card-body").textContent=t.content||"";let n=innerWidth>720,s=((o=j.panel)==null?void 0:o.style)||"solid",r=ne("card");if(r.style.left="",r.style.top="",r.className="card float",rC(s),n?(ne("hs-svg").removeAttribute("hidden"),Qu=performance.now(),vn&&document.body.classList.add("edit-callout")):ne("hs-svg").setAttribute("hidden",""),i.cameraFocus){let a=i.cameraFocus,c=new b(...xp(i)||[0,0,0]),l=null;typeof a.phi=="number"&&typeof a.theta=="number"&&(l=c.clone().add(new b().setFromSpherical(new Kn(at(a.distance,2.4),a.phi,a.theta)))),Dp(c,at(a.distance,2.4),at(a.duration,800),l)}i.audio&&MC(i.audio),wp()}function cC(){var t,n;let i=ne("hs-svg"),e=ne("card");if((Ir==null?void 0:Ir.pid)!=null&&((t=i==null?void 0:i.hasPointerCapture)!=null&&t.call(i,Ir.pid)))try{i.releasePointerCapture(Ir.pid)}catch{}if((Sr==null?void 0:Sr.pid)!=null&&((n=e==null?void 0:e.hasPointerCapture)!=null&&n.call(e,Sr.pid)))try{e.releasePointerCapture(Sr.pid)}catch{}Ir=null,Sr=null,Rp=null,document.body.classList.remove("edit-callout-knee")}function ku(i={}){let e=i.refocus!==!1;clearTimeout(yi),yi=null,ne("card").classList.remove("show","ed-movable"),ne("hs-svg").setAttribute("hidden",""),ne("hs-knee").setAttribute("hidden",""),ne("hs-knee").classList.remove("edit"),document.body.classList.remove("edit-callout"),cC(),Ei.forEach(t=>t.el.classList.remove("active")),Yt=null,e&&Dp(Rs.clone(),Po.length(),700,Po.clone())}function Ro(){ku({refocus:!0})}var mp=new b,gu=new b;function lC(){let i=1/0,e=-1/0,t=1/0,n=-1/0,s=Bs.min,r=Bs.max;for(let o=0;o<8;o++){gu.set(o&1?r.x:s.x,o&2?r.y:s.y,o&4?r.z:s.z).project(mt);let a=(gu.x*.5+.5)*innerWidth,c=(-gu.y*.5+.5)*innerHeight;a<i&&(i=a),a>e&&(e=a),c<t&&(t=c),c>n&&(n=c)}return{minX:i,maxX:e,minY:t,maxY:n}}function hC(i,e){let t=0;for(let r=1;r<i.length;r++)t+=Math.hypot(i[r][0]-i[r-1][0],i[r][1]-i[r-1][1]);let n=t*Math.min(1,Math.max(0,e)),s=[i[0]];for(let r=1;r<i.length;r++){let o=i[r][0]-i[r-1][0],a=i[r][1]-i[r-1][1],c=Math.hypot(o,a)||0;if(n>=c)s.push(i[r]),n-=c;else{let l=c?n/c:0;s.push([i[r-1][0]+o*l,i[r-1][1]+a*l]);break}}return s.map(r=>r[0].toFixed(1)+","+r[1].toFixed(1)).join(" ")}function uC(i,e,t,n){var s,r;(s=e.meta)!=null&&s.leaderHidden?i.setAttribute("points",""):i.setAttribute("points",hC(e.pts,n)),i.classList.toggle("straight",t.leader==="straight"||t.leader==="line"||!!((r=e.meta)!=null&&r.leaderFallback))}function bp(i){return So(hu(i))}function Bp(i,e,t,n,s){return wc(i,e,t,n,s,{maxY:innerHeight-n-24})}function dC(i){return HA(i,innerWidth,innerHeight)}function fC(i,e,t,n,s){let r=lC(),o=20,a=vn?320:8,c=r.minX-8,l=innerWidth-a-r.maxX,u=i<(r.minX+r.maxX)/2?c>=t+o?!0:!(l>=t+o):l>=t+o?!1:c>=t+o,d=u?Math.max(8,r.minX-o-t):Math.min(s,r.maxX+o),f=Math.min(Math.max(66,e-28),innerHeight-n-24);return{cardX:d,cardY:f,edgeDir:u?"left":"right"}}function AC(i,e,t,n,s,r){let o=bp(s),a=o.stub,c=o.tail>0?o.tail:Math.max(24,a*.55),l=s.dir,h,u;switch(l){case"left":h=i-a-t+8,u=e-n/2;break;case"right":h=i+a-8,u=e-n/2;break;case"up":h=i-t/2,u=e-a-n+8;break;case"down":h=i-t/2,u=e+a-8;break;case"upleft":h=i-a-t+8,u=e-c-n+8;break;case"upright":h=i+a-8,u=e-c-n+8;break;case"downleft":h=i-a-t+8,u=e+c-8;break;case"downright":h=i+a-8,u=e+c-8;break;default:h=i,u=e}let d=Bp(h,u,t,n,r);return{cardX:d.x,cardY:d.y,edgeDir:l}}function pC(i,e,t,n,s,r,o){s=hu(s||{});let a,c,l=s.dir||"auto",h={minX:8,minY:66,maxX:o,maxY:innerHeight-n-24,relaxedMaxX:innerWidth-t-8},u=r!=null&&r.calloutPosManual?dC(r.calloutPos):null;if(u){let d=Bp(u.x,u.y,t,n,o,h);a=d.x,c=d.y}else l==="free"||l==="auto"?{cardX:a,cardY:c}=fC(i,e,t,n,o):{cardX:a,cardY:c}=AC(i,e,t,n,s,o);return zA(i,e,t,n,s,r,{cardX:a,cardY:c},h)}function mC(){ne("card").classList.contains("show")&&innerWidth>720&&(ne("hs-svg").removeAttribute("hidden"),Qu=performance.now())}var Ir=null,Sr=null,Rp=null,gC=0,_C=0,EC=0,yC=0;function xC(){if(!Yt)return;Yt.anchor.getWorldPosition(mp),bs.copy(mp).project(mt);let i=(bs.x*.5+.5)*innerWidth,e=(-bs.y*.5+.5)*innerHeight,t=ne("card"),n=t.offsetWidth||280,s=t.offsetHeight||150;if(innerWidth>720){let r=j.panel||{},o=bp(r),a=vn?320:8,c=innerWidth-a-n-8,l=Yt==null?void 0:Yt.data,h=pC(i,e,n,s,r,l,c),{cardX:u,cardY:d,ax:f,ay:m,pts:g}=h;gC=i,_C=e,EC=f,yC=m,Rp=g,t.style.left=u+"px",t.style.top=d+"px",t.style.setProperty("--org",i>u+n/2?"right center":"left center"),vn?t.classList.add("ed-movable"):t.classList.remove("ed-movable");let p=1-Math.pow(1-Math.min(1,(performance.now()-Qu)/320),3);ne("hs-dot").setAttribute("cx",i),ne("hs-dot").setAttribute("cy",e),uC(ne("hs-leader"),h,o,p),ne("hs-knee").setAttribute("hidden","")}else{let c=i-n/2;c=Math.min(Math.max(10,c),innerWidth-n-10);let l=e+22;l+s>innerHeight-148&&(l=e-22-s),l=Math.min(Math.max(60,l),innerHeight-s-10),t.style.left=c+"px",t.style.top=l+"px",t.style.setProperty("--org","center center")}}function Dp(i,e,t,n){let s=He.target.clone(),r=mt.position.clone(),o=i.clone(),a=n||i.clone().add(mt.position.clone().sub(He.target).normalize().multiplyScalar(e)),c=performance.now();cancelAnimationFrame(Ap);let l=h=>h<.5?4*h*h*h:1-Math.pow(-2*h+2,3)/2;(function h(){let u=Math.min(1,(performance.now()-c)/t),d=l(u);He.target.lerpVectors(s,o,d),mt.position.lerpVectors(r,a,d),He.update(),u<1&&(Ap=requestAnimationFrame(h))})()}function CC(){Zn=(j.audio||[]).filter(n=>n&&n.src);let i=ne("audio");if(!Zn.length){i.setAttribute("hidden","");return}i.removeAttribute("hidden");let e=ne("au-sel"),t=ne("au-name");Zn.length>1?(e.removeAttribute("hidden"),t.setAttribute("hidden",""),e.innerHTML=Zn.map((n,s)=>`<option value="${s}">${(n.label||"\u8BB2\u89E3 "+(s+1)).replace(/</g,"&lt;")}</option>`).join(""),e.onchange=()=>Gc(+e.value,!0)):(e.setAttribute("hidden",""),t.removeAttribute("hidden"),t.textContent=Zn[0].label||"\u8BED\u97F3\u8BB2\u89E3"),Rr=-1,Gc(0,!1),Hc(IC())}function Gc(i,e){let t=ne("au-el"),n=Zn[i];if(!n)return;i!==Rr&&(t.removeAttribute("data-sy-fallback"),t.src=Fs(n.src),Rr=i);let s=ne("au-sel");s.hasAttribute("hidden")||(s.value=String(i));let r=ne("au-name");r.hasAttribute("hidden")||(r.textContent=n.label||"\u8BED\u97F3\u8BB2\u89E3"),e?(wo=!0,t.play().catch(()=>{})):(Do(!1),ne("au-prog").style.width="0%",ne("au-time").textContent="0:00")}function MC(i){let e=Zn.findIndex(t=>t.id===i);e<0||(Hc(!1),!(e===Rr&&!ne("au-el").paused)&&Gc(e,!0))}function Do(i){typeof i=="boolean"&&(Fc=i);let e=ne("audio").classList.contains("mini");ne("audio").classList.toggle("playing",Fc);let t=ne("au-play");t.textContent=e?"\u266A":Fc?"\u275A\u275A":"\u25B6",t.setAttribute("aria-label",e?Fc?"\u5C55\u5F00\u8BED\u97F3\u8BB2\u89E3\u64AD\u653E\u5668\uFF08\u6B63\u5728\u64AD\u653E\uFF09":"\u5C55\u5F00\u8BED\u97F3\u8BB2\u89E3\u64AD\u653E\u5668":"\u64AD\u653E/\u6682\u505C\u8BED\u97F3\u8BB2\u89E3\uFF08\u7A7A\u683C\u952E\uFF09")}function IC(){var e;let i=(e=j.ui)==null?void 0:e.audioCollapsed;return i===!0||i===!1?i:matchMedia("(pointer:coarse)").matches||innerWidth<768}function Hc(i){ne("audio").classList.toggle("mini",!!i),Do()}function SC(i){if(!isFinite(i)||i<0)return"0:00";let e=Math.floor(i/60),t=Math.floor(i%60);return e+":"+String(t).padStart(2,"0")}function vC(){let i=ne("au-el");ne("au-play").onclick=()=>{if(Zn.length){if(ne("audio").classList.contains("mini")){Hc(!1);return}Rr<0&&Gc(0,!1),i.paused?(wo=!0,i.play().catch(()=>{})):(wo=!1,i.pause())}},ne("au-collapse").onclick=()=>Hc(!0),i.onplay=()=>Do(!0),i.onpause=()=>Do(!1),i.onended=()=>{wo=!1,Do(!1),ne("au-prog").style.width="0%"},i.onerror=()=>{if(i.dataset.syFallback==="1")return;let e=Zn[Rr],t=e?Vc(e.src):"";if(!t)return;let n=wo;i.dataset.syFallback="1",i.src=t,n&&i.addEventListener("canplay",()=>{i.play().catch(()=>{})},{once:!0})},i.ontimeupdate=()=>{let e=i.duration?i.currentTime/i.duration*100:0;ne("au-prog").style.width=e+"%",ne("au-time").textContent=SC(i.currentTime)},ne("au-bar").onclick=e=>{if(!i.duration)return;let t=ne("au-bar").getBoundingClientRect();i.currentTime=Math.max(0,Math.min(1,(e.clientX-t.left)/t.width))*i.duration}}function TC(){let i=Dr(j.i18n);ne("c-name").textContent=i.title||"\u7ACB\u4F53\u9274\u8D4F",ne("c-sub").textContent=i.subtitle||"",ne("topbar").style.display=j.ui&&j.ui.showTitle===!1?"none":"",document.querySelectorAll("#presets .preset").forEach(e=>{let t=(j.presets||[]).find(n=>n.id===e.dataset.id);t&&(e.textContent=Dr(t.label)||t.id)}),Lp()}var Bu={rotate:{zh:"\u81EA\u52A8\u65CB\u8F6C",en:"Auto"},hot:{zh:"\u70ED\u70B9",en:"Hotspots"},reset:{zh:"\u91CD\u7F6E",en:"Reset"},full:{zh:"\u5168\u5C4F",en:"Full"},editPanel:{zh:"\u7F16\u8F91",en:"Edit"},editPanelClose:{zh:"\u6536\u8D77",en:"Close"}},wC=(()=>{let i=e=>`<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor"
    stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${e}</svg>`;return{rotate:i('<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v4h-4"/>'),hot:i('<path d="M12 3.2 20.8 12 12 20.8 3.2 12z"/><circle cx="12" cy="12" r="2.6" fill="currentColor" stroke="none"/>'),reset:i('<path d="M9 4v5H4"/><path d="M15 4v5h5"/><path d="M9 20v-5H4"/><path d="M15 20v-5h5"/>'),full:i('<path d="M4 9V4h5"/><path d="M20 9V4h-5"/><path d="M4 15v5h5"/><path d="M20 15v5h-5"/>'),editPanel:i('<path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/>')}})();function Lp(){document.querySelectorAll("#actions .btn").forEach(i=>{let e=i.dataset.k;Bu[e]&&(i.querySelector(".tx").textContent=Bu[e][Ru])})}var Nc=(()=>{let i=document.documentElement,e=i.requestFullscreen||i.webkitRequestFullscreen||i.msRequestFullscreen,t=document.exitFullscreen||document.webkitExitFullscreen||document.msExitFullscreen,n=document.fullscreenEnabled??document.webkitFullscreenEnabled??!0,s=()=>!!(document.fullscreenElement||document.webkitFullscreenElement||document.msFullscreenElement);return{supported:!!(e&&t)&&n!==!1,active:s,toggle(){let r=s()?t.call(document):e.call(i);r&&typeof r.catch=="function"&&r.catch(()=>{})}}})();function wr(){let i=document.querySelector("[data-k=rotate]");i&&(i.classList.toggle("on",He.autoRotate),i.setAttribute("aria-pressed",He.autoRotate));let e=document.querySelector("[data-k=hot]");e&&(e.classList.toggle("on",Tr),e.setAttribute("aria-pressed",Tr));let t=document.querySelector("[data-k=full]");if(t){let n=Nc.active();t.classList.toggle("on",n),t.setAttribute("aria-pressed",n)}}function br(i){return i?JSON.parse(JSON.stringify(i)):{}}function bC(){var i;Du={exposure:at((i=j.renderer)==null?void 0:i.exposure,1.05),environment:br(j.environment),lights:br(j.lights),shadow:br(j.shadow)}}function BC(){var e,t;if(No=null,document.querySelectorAll("#presets .preset").forEach(n=>{n.classList.remove("on"),n.setAttribute("aria-pressed","false")}),!$e)return;let i=Du;if(!i){$e.toneMappingExposure=at((e=j.renderer)==null?void 0:e.exposure,1.05),Ls(),Oc(),Uo();return}$e.toneMappingExposure=i.exposure,j.environment=br(i.environment),j.lights=br(i.lights),j.shadow=br(i.shadow),((t=i.environment)==null?void 0:t.mode)==="panorama"&&Qc?(Ls(),Tp()):(Wc(),Ls()),Oc(),Uo()}function Pp(){document.querySelectorAll("#presets .preset").forEach(i=>{let e=i.dataset.id===No;i.classList.toggle("on",e),i.setAttribute("aria-pressed",e?"true":"false")})}function RC(){let i=j.ui||{},e=ne("presets"),t=0;(j.presets||[]).forEach((r,o)=>{if(!i.showPresets||r.showAsButton===!1||t>=4)return;t++;let a=document.createElement("button");a.className="preset",a.dataset.id=r.id,a.textContent=Dr(r.label)||r.id,a.setAttribute("aria-pressed","false"),a.onclick=()=>DC(r),e.appendChild(a)});let n=ne("actions"),s=(r,o,a)=>{let c=document.createElement("button");c.className="btn"+(o?" on":""),c.dataset.k=r,c.innerHTML=`<span class="ic">${wC[r]}</span><span class="tx"></span>`,c.onclick=a,n.appendChild(c)};if(i.showAutoRotateButton!==!1&&s("rotate",He.autoRotate,()=>{He.autoRotate=!He.autoRotate,He.autoRotate&&Yt&&(ku({refocus:!1}),He.target.copy(Rs),He.update()),wr()}),i.showHotspotButton!==!1&&(j.hotspots||[]).length&&s("hot",!0,()=>{Tr=!Tr,Tr||Ro(),wr()}),i.showResetButton!==!1&&s("reset",!1,()=>{Ro()}),vn&&s("editPanel",!1,Kx),i.showFullscreenButton!==!1&&Nc.supported&&s("full",Nc.active(),()=>Nc.toggle()),Lp(),wr(),Lu(),$e){let r=$e.toneMappingExposure,o=(j.presets||[]).find(a=>Math.abs(at(a.exposure,-99)-r)<.02);o&&(No=o.id),Pp()}}function DC(i){if(No===i.id){BC();return}LC(i)}function LC(i){var e;No=i.id,$e.toneMappingExposure=at(i.exposure,$e.toneMappingExposure),i.background&&(ft.background=(e=j.environment)!=null&&e.visibleBackground?ft.background:new Ee(i.background)),i.environment&&(j.environment=Object.assign(j.environment||{},i.environment),Gi(j).kind==="panorama"&&Qc?(Ls(),Tp()):(Wc(),Ls())),i.lights&&(j.lights=j.lights||{},["ambient",...fu].forEach(t=>{i.lights[t]&&(j.lights[t]=Object.assign(j.lights[t]||{},i.lights[t]))}),typeof i.lights.followCamera=="boolean"&&(j.lights.followCamera=i.lights.followCamera),Oc()),i.shadow&&(j.shadow=Object.assign(j.shadow||{},i.shadow),Uo()),Pp()}var gp=innerWidth<innerHeight;function PC(){let i=innerWidth<innerHeight;mt.aspect=innerWidth/innerHeight,mt.updateProjectionMatrix(),$e.setSize(innerWidth,innerHeight),i!==gp&&(gp=i,Nt&&zx()),Xx(),Ep&&Ep()}var FC=0,_u=performance.now(),Eu=0,_p=null,Ep=null;function Fp(){bx=requestAnimationFrame(Fp),He.update(),Cp(),aC(),xC(),$e.render(ft,mt),_p&&_p(),Eu++;let i=performance.now();i-_u>=500&&(FC=Math.round(Eu*1e3/(i-_u)),Eu=0,_u=i)}var yu=null,xu=null;function UC(){let i=new gc;yu||(yu=new Ec().setDecoderPath("./vendor/draco/")),i.setDRACOLoader(yu);try{xu||(xu=new _i().setTranscoderPath("./vendor/basis/").detectSupport($e)),i.setKTX2Loader(xu)}catch{}return i}var Cu=null;function NC(i){i!==On||window.__SY_PLAYER.ready||(bC(),ne("topbar").removeAttribute("hidden"),ne("hud").removeAttribute("hidden"),ne("loading").classList.add("fade"),setTimeout(()=>ne("loading").setAttribute("hidden",""),460),ne("hint").classList.add("show"),setTimeout(()=>ne("hint").classList.remove("show"),2600),Dx(),Fp())}function OC(){var c;clearTimeout(Fo);let i=++On;Ps=null,Qn=null,Du=null,ft=new ss,ft.background=new Ee(((c=j.renderer)==null?void 0:c.background)||"#0f1118"),mt=new Mt(40,innerWidth/innerHeight,.1,1e3),He=new mc(mt,$e.domElement),He.enableDamping=!0,He.dampingFactor=.08,He.enablePan=!1,He.rotateSpeed=.9,He.addEventListener("start",()=>{He.autoRotate=!1,wr()}),nC(),Ls();let e=Gi(j);if(e.kind==="panorama"){let l=Fs(e.url);Lo?eC(l):kc()}Oc();let t=Fs(j.assets.model),n=Vc(j.assets.model);if(!t)return Ds("\u6A21\u578B\u5730\u5740\u65E0\u6548",!0);let s=ep({idleMs:YA(j,window.__SY_PLAYER,null),totalMs:JA(j,window.__SY_PLAYER,null),onIdle:()=>{window.__SY_PLAYER.ready||i!==On||Tu("\u6A21\u578B\u52A0\u8F7D\u8D85\u65F6\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5")},onTotal:()=>{window.__SY_PLAYER.ready||i!==On||Tu(s.isDownloadComplete()?"\u6A21\u578B\u89E3\u6790\u8D85\u65F6\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u6216\u66F4\u6362\u8BBE\u5907":"\u6A21\u578B\u52A0\u8F7D\u8D85\u65F6\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5")},onDownloadComplete:()=>{i===On&&(ne("bar").style.width="100%",ne("load-text").textContent="\u6B63\u5728\u89E3\u6790\u6A21\u578B\u2026")}});Cu=s,s.start();let r=l=>{if(s.clear(),Cu=null,!(i!==On||window.__SY_PLAYER.ready)){Nt=l.scene;try{Ux(Nt),wu(),ft.add(Nt),Uo(),Gx(),oC(),RC(),TC(),CC(),vC()}catch{Ds("\u5C55\u54C1\u914D\u7F6E\u65E0\u6CD5\u89E3\u6790\uFF0C\u8BF7\u68C0\u67E5\u70ED\u70B9\u6570\u636E\u540E\u91CD\u8BD5",!0);return}(async()=>{try{await iC(i)}catch{}i!==On||window.__SY_PLAYER.ready||(Nt&&wu(),NC(i))})()}},o=l=>{if(i===On&&(s.progress(l.loaded,l.total),!s.isDownloadComplete()))if(l.total){let h=Math.min(100,Math.round(l.loaded/l.total*100));ne("bar").style.width=h+"%",ne("load-text").textContent=`\u6B63\u5728\u52A0\u8F7D\u6A21\u578B\u2026 ${h}%`}else typeof l.loaded=="number"&&l.loaded>0&&(ne("load-text").textContent=`\u6B63\u5728\u52A0\u8F7D\u6A21\u578B\u2026 ${l.loaded} B`)},a=(l,h)=>{UC().load(l,r,o,()=>{if(i===On){if(h&&n&&n!==l){ne("bar").style.width="0%",ne("load-text").textContent="CDN \u672A\u901A\uFF0C\u6539\u8D70\u5DE5\u4F5C\u53F0\u6A21\u578B\u2026",s.start(),a(n,!1);return}s.clear(),Cu=null,Ds("\u6A21\u578B\u52A0\u8F7D\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5",!0)}})};a(t,!0),addEventListener("resize",PC);for(let l of["fullscreenchange","webkitfullscreenchange","msfullscreenchange"])document.addEventListener(l,wr);ne("card-close").onclick=Ro,ne("card-close").addEventListener("keydown",l=>{(l.key==="Enter"||l.key===" ")&&(l.preventDefault(),Ro())}),ne("scene").addEventListener("pointerdown",()=>{ne("card").classList.contains("show")}),addEventListener("keydown",l=>{var h;if(l.key==="Escape")(Yt||yi)&&Ro();else if(l.key===" "||l.code==="Space"){let u=(((h=l.target)==null?void 0:h.tagName)||"").toLowerCase();if(u==="input"||u==="textarea"||u==="select"||u==="button"||u==="a")return;if(Zn.length){l.preventDefault();let d=ne("au-el");d.paused?d.play().catch(()=>{}):d.pause()}}})}var Mu=!1;async function QC(){var e;if(Mu)return;Mu=!0;let i=++bo;window.__SY_PLAYER.bootStarted=!0,window.__SY_PLAYER.ready=!1,window.__SY_PLAYER.failed=!1,Lx(i),ne("error").setAttribute("hidden",""),ne("loading").removeAttribute("hidden"),ne("loading").classList.remove("fade");try{if(window.__CFG__)j=window.__CFG__;else{let t=qA(Su),n=await Px(t,uu(null,window.__SY_PLAYER,null));if(!n.ok)throw new Error(`HTTP ${n.status} \xB7 ${t}`);j=await n.json()}if(i!==bo)return;if(XA(j.hotspots||[]),!((e=j==null?void 0:j.assets)!=null&&e.model)){Ds("\u914D\u7F6E\u65E0\u6548\uFF1A\u7F3A\u5C11 assets.model\uFF08"+Su+"config.json \u672A\u6B63\u786E\u8FD4\u56DE\u5C55\u54C1\u6570\u636E\uFF09",!0);return}if(!Fx()){Ds("\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301 3D \u5C55\u793A\uFF0C\u8BF7\u66F4\u6362\u6D4F\u89C8\u5668\u6216\u5347\u7EA7\u5FAE\u4FE1",!1);return}document.title=Dr(j.i18n).title||"\u7ACB\u4F53\u9274\u8D4F",j.assets.poster&&Cx(j.assets.poster),vn&&ne("ed-badge").removeAttribute("hidden"),OC()}catch(t){if(i!==bo)return;let n=(t==null?void 0:t.name)==="AbortError"?"\u914D\u7F6E\u52A0\u8F7D\u8D85\u65F6\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5":"\u914D\u7F6E\u52A0\u8F7D\u5931\u8D25\uFF1A"+t.message+"\uFF08\u8BF7\u4ECE exhibits \u76EE\u5F55\u542F\u52A8 HTTP \u670D\u52A1\uFF0C\u5E76\u786E\u8BA4 ?ex= \u53C2\u6570\u6B63\u786E\uFF09";Ds(n,!0)}finally{Mu=!1}}ne("err-btn").onclick=()=>{location.reload()};QC();
/**
 * @license
 * Copyright 2010-2024 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
