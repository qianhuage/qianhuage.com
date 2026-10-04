import { trackPoints, trackMeta } from './track.js';

export function createCrossingMapRoute({ map, mapboxgl, pauseRotation }) {
  const segments = [];
  let current = [];
  for (let i = 0; i < trackPoints.length; i++) {
    const [lat, lng, time] = trackPoints[i];
    if (i && time - trackPoints[i - 1][2] > trackMeta.gapThresholdSeconds) {
      if (current.length > 1) segments.push(current);
      current = [];
    }
    current.push([lng, lat]);
  }
  if (current.length > 1) segments.push(current);
  const route = {type:'Feature',properties:{},geometry:{type:'MultiLineString',coordinates:segments}};
  const ports = {type:'FeatureCollection',features:[trackPoints[0],trackPoints.at(-1)].map(([lat,lng])=>({type:'Feature',properties:{},geometry:{type:'Point',coordinates:[lng,lat]}}))};
  function install() {
    if (map.getSource('pacific-crossing')) return;
    map.addSource('pacific-crossing',{type:'geojson',data:route});
    map.addLayer({id:'pacific-crossing-line',type:'line',source:'pacific-crossing',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#eeeeee','line-width':1.7,'line-opacity':.85}});
    map.addLayer({id:'pacific-crossing-hit',type:'line',source:'pacific-crossing',paint:{'line-color':'#fff','line-width':18,'line-opacity':0}});
    map.addSource('pacific-crossing-ports',{type:'geojson',data:ports});
    map.addLayer({id:'pacific-crossing-ports',type:'circle',source:'pacific-crossing-ports',paint:{'circle-radius':3.5,'circle-color':'#080808','circle-stroke-color':'#fff','circle-stroke-width':1.2}});
  }
  map.on('style.load',install);
  if(map.isStyleLoaded())install();else map.once('load',install);
  map.on('click','pacific-crossing-hit',()=>location.assign('/pacificcrossing/'));
  map.on('mouseenter','pacific-crossing-hit',()=>{map.getCanvas().style.cursor='pointer';pauseRotation();});
  map.on('mouseleave','pacific-crossing-hit',()=>{map.getCanvas().style.cursor='';});
  const label=document.createElement('a');
  label.className='crossing-map-label';label.href='/pacificcrossing/';
  label.setAttribute('aria-label','Explore Pacific Crossing, Honolulu to Monterey');
  label.innerHTML='<span>PACIFIC CROSSING ↗</span><small>HONOLULU → MONTEREY</small>';
  label.addEventListener('pointerenter',pauseRotation);label.addEventListener('focus',pauseRotation);
  label.addEventListener('click',event=>event.stopPropagation());
  const middle=trackPoints[Math.floor(trackPoints.length*.58)];
  new mapboxgl.Marker({element:label,anchor:'bottom',offset:[0,-12]}).setLngLat([middle[1],middle[0]]).addTo(map);
  const updateVisibility=()=>{label.hidden=map.getZoom()>7;};
  map.on('zoom',updateVisibility);updateVisibility();
}
