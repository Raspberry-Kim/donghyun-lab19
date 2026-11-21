import struct
def wwid(name):
    name=name.upper().encode()
    n=0;i=0
    while i<len(name):
        a=0
        for j in range(4):
            a>>=8
            if i<len(name): a|=name[i]<<24; i+=1
        n=((n<<1)|(n>>31))&0xffffffff
        n=(n+a)&0xffffffff
    return n
class Mix:
    def __init__(s,path):
        s.d=open(path,'rb').read()
        flags=struct.unpack_from('<I',s.d,0)[0]
        off=4 if (flags&0xffff)==0 else 0
        assert flags==0 or off==0, hex(flags)
        cnt,size=struct.unpack_from('<HI',s.d,off); off+=6
        s.e={}
        for i in range(cnt):
            fid,o,sz=struct.unpack_from('<III',s.d,off+i*12); s.e[fid]=(o,sz)
        s.base=off+cnt*12
    def get(s,name):
        e=s.e.get(wwid(name))
        if not e: return None
        return s.d[s.base+e[0]:s.base+e[0]+e[1]]
def tem(b):
    w,h,count,alloc,mw,mh,size,icons,pals,remaps,trans,cmap,mp=struct.unpack_from('<6h7i',b,0)
    ic=[b[icons+i*576:icons+(i+1)*576] for i in range(count)]
    m=b[mp:mp+mw*mh]; cm=b[cmap:cmap+count]
    return dict(w=mw,h=mh,count=count,icons=ic,map=m,cmap=cm)
if __name__=='__main__':
    m=Mix('/tmp/ra/assets/temperat.mix')
    for n in ['temperat.pal','sh01.tem','w1.tem','clear1.tem','sh30.tem']:
        b=m.get(n); print(n, None if b is None else len(b))
    t=tem(m.get('sh01.tem')); print(t['w'],t['h'],t['count'],list(t['map']),list(t['cmap']))
