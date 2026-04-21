const fs = require('fs');
let html = fs.readFileSync('learn/index.html', 'utf8');

const t_match = html.match(/const\s+topics=\{[\s\S]*?\};/);
const wp_match = html.match(/const\s+wordProblems\s*=\s*\[[\s\S]*?\];/);
const geo_match = html.match(/const\s+geoProblems\s*=\s*\[[\s\S]*?\];/);
const words_match = html.match(/const\s+words=\[\[.*?\]\];/s);

const newTopics = \const topics={nature:['OCEAN','RIVER','FOREST','MOUNTAIN','DESERT','VALLEY','GLACIER','VOLCANO','CANYON','ISLAND','MEADOW','PLATEAU','TUNDRA','MARSH','DELTA','REEF','SWAMP','CLIFF','CRATER','JUNGLE','LAKE','BUSH','BAMBOO','CLOUD','STORM','BREEZE','FROST','SNOW','ICE','SAND','DUNES','SOIL','DUST','ROCK','STONE','MINERAL','FOSSIL','CAVE','CAVERN','GORGE','GEYSER','SPRING','STREAM','CREEK','BROOK','WATERFALL','RAPIDS','TIDE','WAVE'],science:['ATOM','PROTON','NEUTRON','QUARK','PHOTON','PLASMA','FUSION','ENERGY','GRAVITY','INERTIA','ENTROPY','IMPULSE','TORQUE','PRISM','LASER','LENS','OPTICS','KINETIC','POTENTIAL','FRICTION','THERMAL','MAGNET','DIPOLE','RADIATION','DECAY','ISOTOPE','ELEMENT','MOLECULE','COMPOUND','REACTION','OXIDATION','PHASE','SOLID','LIQUID','GAS','VACUUM','CURRENT','VOLTAGE','OHM','WATT','AMPERE','CIRCUIT','RESISTOR','CAPACITOR','INDUCTOR','DIODE','TRANSISTOR','SENSOR','MOTOR','GEAR'],space:['PLANET','GALAXY','NEBULA','COMET','QUASAR','PULSAR','NOVA','ORBIT','LUNAR','SOLAR','COSMOS','METEOR','SATURN','VENUS','PLUTO','MARS','JUPITER','URANUS','NEPTUNE','MERCURY','EARTH','MOON','SUN','STAR','ASTEROID','ECLIPSE','HORIZON','ZENITH','NADIR','EQUATOR','TROPIC','POLE','CRATER','RING','SATELLITE','PROBE','ROVER','ROCKET','SHUTTLE','CAPSULE','STATION','MODULE','ASTRONAUT','TELESCOPE','OBSERVATORY','LENS','MIRROR','PRISM','GRAVITY','VACUUM'],food:['QUINOA','SAFFRON','PAPAYA','MANGO','WASABI','TAHINI','KIMCHI','GINGER','CUMIN','BASIL','THYME','FENNEL','CLOVE','TURMERIC','CACAO','GARLIC','ONION','LEMON','LIME','APPLE','PEAR','ORANGE','GRAPE','CHERRY','PEACH','PLUM','BERRY','MELON','BANANA','TOMATO','POTATO','PEPPER','CARROT','ONION','BEET','BEAN','PEA','LENTIL','CORN','WHEAT','RICE','OAT','BARLEY','RYE','MILLET','BREAD','PASTA','NOODLE','SOUP','STEW'],math:['PRIME','VECTOR','MATRIX','FACTOR','RADIUS','COSINE','DOMAIN','VERTEX','MODULO','AXIOM','PROOF','SLOPE','UNION','GRAPH','LIMIT','ANGLE','DEGREE','RADIAN','SINE','NUMBER','INTEGER','FRACTION','DECIMAL','PERCENT','RATIO','PROPORTION','EQUAL','LESS','GREATER','PLUS','MINUS','TIMES','DIVIDE','POWER','ROOT','SQUARE','CUBE','CIRCLE','TRIANGLE','RECTANGLE','POLYGON','SPHERE','CYLINDER','CONE','PYRAMID','PRISM','VOLUME','AREA','LENGTH','WIDTH'],coding:['ARRAY','CLASS','STACK','QUEUE','LOOP','PARSE','TOKEN','DEBUG','CACHE','QUERY','INDEX','REGEX','YIELD','ASYNC','BRANCH','FUNCTION','VARIABLE','STRING','NUMBER','BOOLEAN','OBJECT','METHOD','RETURN','AWAIT','PROMISE','FETCH','ERROR','CATCH','THROW','TRY','IF','ELSE','WHILE','FOR','SWITCH','CASE','BREAK','CONTINUE','IMPORT','EXPORT','MODULE','PACKAGE','LIBRARY','FRAMEWORK','SERVER','CLIENT','NETWORK','SOCKET','PROTOCOL','PORT'],animals:['FALCON','JAGUAR','NARWHAL','OCTOPUS','PLATYPUS','PENGUIN','CONDOR','MANTIS','PYTHON','IGUANA','HYENA','TOUCAN','WALRUS','BADGER','WOMBAT','LION','TIGER','BEAR','WOLF','FOX','DEER','ELK','MOOSE','BISON','SHEEP','GOAT','COW','PIG','HORSE','DONKEY','ZEBRA','CAMEL','ELEPHANT','GIRAFFE','RHINO','HIPPO','MONKEY','APE','CHIMP','GORILLA','BABOON','LEMUR','SLOTH','BAT','RAT','MOUSE','SQUIRREL','BEAVER','CHIPMUNK'],colors:['RED','GREEN','BLUE','YELLOW','ORANGE','PURPLE','CYAN','MAGENTA','PINK','BROWN','BLACK','WHITE','GRAY','SILVER','GOLD','COPPER','BRONZE','RUST','RUBY','CORAL','PEACH','MAROON','CRIMSON','SCARLET','ROSE','BLUSH','SALMON','MELON','AMBER','OLIVE','LEMON','LIME','MINT','JADE','FERN','OLIVE','PINE','MOSS','TEAL','AQUA','CYAN','AZURE','COBALT','INDIGO','NAVY','SLATE','PLUM','VIOLET','LILAC','ORCHID'],music:['PIANO','GUITAR','VIOLIN','BASS','DRUM','FLUTE','CELLO','HORN','TRUMPET','TUBA','OBOE','HARP','ORGAN','LUTE','LYRE','BANJO','SITAR','UKULELE','MANDOLIN','ZITHER','HARPSICHORD','CLARINET','BASSOON','SAXOPHONE','RECORDER','PICCOLO','FIFE','WHISTLE','BAGPIPE','ACCORDION','HARMONICA','XYLOPHONE','MARIMBA','VIBRAPHONE','GLOCKENSPIEL','TYMPANI','CHIME','BELL','GONG','CYMBAL','TRIANGLE','TAMBOURINE','CASTANET','MARACA','CLAVE','WOODBLOCK','COWBELL','GUIRO','CABASA','AGOGO'],sports:['SOCCER','BASEBALL','FOOTBALL','BASKETBALL','VOLLEYBALL','HOCKEY','TENNIS','GOLF','RUGBY','CRICKET','LACROSSE','POLO','SWIM','DIVE','SURF','ROW','SAIL','SKI','SKATE','SNOWBOARD','SLED','BOBSLED','LUGE','SKELETON','CURLING','ICE','TRACK','FIELD','RUN','JUMP','THROW','DISCUS','JAVELIN','HAMMER','POLE','VAULT','MARATHON','SPRINT','RELAY','HURDLE','DECATHLON','HEPTATHLON','PENTATHLON','TRIATHLON','BIATHLON','WRESTLE','BOX','JUDO','KARATE','TAEKWONDO']};\;

const newGeo = \const geoProblems = [
      ()=>{const s=Math.floor(Math.random()*10)+2; mathAns=s*s; return \\\Area of a square with side \?\\\;},
      ()=>{const l=Math.floor(Math.random()*12)+3,w=Math.floor(Math.random()*8)+2; mathAns=l*w; return \\\Area of rectangle \ � \?\\\;},
      ()=>{const s=Math.floor(Math.random()*10)+2; mathAns=4*s; return \\\Perimeter of square with side \?\\\;},
      ()=>{const l=Math.floor(Math.random()*12)+3,w=Math.floor(Math.random()*8)+2; mathAns=2*(l+w); return \\\Perimeter of rectangle \ � \?\\\;},
      ()=>{const r=Math.floor(Math.random()*8)+2; mathAns=+(Math.PI*r*r).toFixed(1); return \\\Area of circle radius \? (round to .1)\\\;},
      ()=>{const b=Math.floor(Math.random()*10)+3,h=Math.floor(Math.random()*8)+2; mathAns=(b*h)/2; return \\\Area of triangle base \, height \?\\\;},
      ()=>{const s=Math.floor(Math.random()*10)+2; mathAns=s*s*s; return \\\Volume of a cube with side \?\\\;},
      ()=>{const l=Math.floor(Math.random()*8)+2,w=Math.floor(Math.random()*8)+2,h=Math.floor(Math.random()*8)+2; mathAns=l*w*h; return \\\Volume of block \�\�\?\\\;},
      ()=>{const b=Math.floor(Math.random()*10)+2,h=Math.floor(Math.random()*10)+2; mathAns=(b*h)/2; return \\\Area of right triangle w/ base \, height \?\\\;},
      ()=>{const a=Math.floor(Math.random()*60)+20,b=Math.floor(Math.random()*60)+20; mathAns=180-a-b; return \\\Two angles of a triangle are \� and \�. What is the third?\\\;},
      ()=>{const s1=Math.floor(Math.random()*10)+3, s2=Math.floor(Math.random()*10)+3, s3=Math.floor(Math.random()*10)+3; mathAns=s1+s2+s3; return \\\Perimeter of triangle with sides \, \, \?\\\;},
      ()=>{const r=Math.floor(Math.random()*6)+2; mathAns=+(2*Math.PI*r).toFixed(1); return \\\Circumference of circle radius \? (round to .1)\\\;},
      ()=>{const d=Math.floor(Math.random()*12)+4; mathAns=+(Math.PI*d).toFixed(1); return \\\Circumference of circle diameter \? (round to .1)\\\;},
      ()=>{const d=Math.floor(Math.random()*12)+4; mathAns=d/2; return \\\Radius of a circle with diameter \?\\\;},
      ()=>{const a=Math.floor(Math.random()*120)+20; mathAns=180-a; return \\\Supplementary angle to \�?\\\;},
      ()=>{const a=Math.floor(Math.random()*60)+10; mathAns=90-a; return \\\Complementary angle to \�?\\\;},
      ()=>{const sides=Math.floor(Math.random()*6)+5; mathAns=(sides-2)*180; return \\\Sum of interior angles of a \-sided polygon?\\\;},
      ()=>{const r=Math.floor(Math.random()*5)+2, h=Math.floor(Math.random()*10)+3; mathAns=+(Math.PI*r*r*h).toFixed(1); return \\\Volume of cylinder w/ radius \, height \? (round to .1)\\\;},
      ()=>{const p=Math.floor(Math.random()*20)+10, a=Math.floor(Math.random()*8)+3; mathAns=(p*a)/2; return \\\Area of regular polygon w/ perimeter \ & apothem \?\\\;},
      ()=>{const d1=Math.floor(Math.random()*10)+4, d2=Math.floor(Math.random()*10)+4; mathAns=(d1*d2)/2; return \\\Area of rhombus with diagonals \ and \?\\\;}
  ];\;

const newWp = \const wordProblems = [
      {t:(a,b)=>\\\You have \ apples and get \ more. How many total?\\\,op:'+'},
      {t:(a,b)=>\\\There are \ birds. \ fly away. How many are left?\\\,op:'-'},
      {t:(a,b)=>\\\You have \ bags with \ candies each. How many candies?\\\,op:'�'},
      {t:(a,b)=>\\\\ cookies shared equally among \ friends. How many each?\\\,op:'�'},
      {t:(a,b)=>\\\A garden has \ rows of \ flowers. How many flowers total?\\\,op:'�'},
      {t:(a,b)=>\\\You had \ stickers and gave away \. How many left?\\\,op:'-'},
      {t:(a,b)=>\\\\ students split into \ equal teams. How many per team?\\\,op:'�'},
      {t:(a,b)=>\\\A shelf has \ books. You add \ more. How many now?\\\,op:'+'},
      {t:(a,b)=>(a>b ? \\\A game costs $\\$\ and you have $\\$\. How much do you need?\\\ : \\\You have $\\$\ and get $\\$\. Total money?\\\),op:(a>b?'-':'+')},
      {t:(a,b)=>\\\You save $\\$\ per week for \ weeks. How much saved?\\\,op:'�'},
      {t:(a,b)=>\\\A train travels \ miles in \ hours. Miles per hour?\\\,op:'�'},
      {t:(a,b)=>\\\If \ cars each hold \ people, total people?\\\,op:'�'},
      {t:(a,b)=>\\\You score \ points then \ points. Total score?\\\,op:'+'},
      {t:(a,b)=>\\\A \ cm rope is cut into \ cm pieces. How many pieces?\\\,op:'�'},
      {t:(a,b)=>\\\You walk \ blocks, then bike \ blocks. Total distance?\\\,op:'+'},
      {t:(a,b)=>(a>b ? \\\You need \ cups of flour. You have \ cups. Shortage?\\\ : \\\You have \ cups, need \ more. Total cups?\\\),op:(a>b?'-':'+')},
      {t:(a,b)=>\\\A box holds \ items. You have \ boxes. Total items?\\\,op:'�'},
      {t:(a,b)=>\\\\ puzzle pieces, but \ are lost. Pieces remaining?\\\,op:'-'},
      {t:(a,b)=>\\\\ minutes total for \ equal tasks. Minutes per task?\\\,op:'�'},
      {t:(a,b)=>\\\\ pages read today, \ yesterday. Total pages?\\\,op:'+'},
      {t:(a,b)=>\\\Plant \ seeds in \ rows equally. Seeds per row?\\\,op:'�'},
      {t:(a,b)=>\\\Earn $\\$\ an hour for \ hours. Total earnings?\\\,op:'�'},
      {t:(a,b)=>(a>b ? \\\A \-seater bus has \ empty seats. Passengers?\\\ : \\\A \-seater bus has \ passengers. Empty seats?\\\),op:'-'},
      {t:(a,b)=>(a>b ? \\\Collect \ shells, give \ to a friend. Shells kept?\\\ : \\\Collect \ shells, find \ more. Total shells?\\\),op:(a>b?'-':'+')},
      {t:(a,b)=>\\\Stack \ blocks, each \ inches tall. Total height?\\\,op:'�'},
      {t:(a,b)=>\\\Buy \ items at $\\$\ each. Total cost?\\\,op:'�'},
      {t:(a,b)=>\\\Share \ marbles among \ siblings. Marbles each?\\\,op:'�'}
  ];\;

const newWords = \const words=[
    ['MATH','FIRE','RAIN','BLUE','DARK','WIND','COLD','STAR','LAMP','BOOK','FROG','PLUM','GRID','CUBE','FLUX','ATOM','IRON','BIRD','DOOR','LAKE','SNOW','FISH','GOLD','MOON','TREE','WAVE','ROCK','TIME','SHIP','ROAD','BONE','LEAF','CASH','MILK','MEAT','SALT','OATS','SOUP','CORN','DUST','SAND','SOIL','TENT','CAVE','CAMP','DESK','CHIP','CODE','BYTE','ICON'],
    ['BRAIN','CHESS','DREAM','FLAME','GHOST','HONEY','LIGHT','OCEAN','PRIME','SOLAR','PIXEL','QUARK','MORSE','LASER','NERVE','CLOCK','PLANT','RIVER','FRUIT','BREAD','JUICE','WATER','CLOUD','STORM','GLASS','STEEL','STONE','MUSIC','SOUND','DANCE','MAGIC','POWER','SPEED','FORCE','FAITH','PEACE','TRUTH','SMILE','VOICE','WORLD','HEART','BLOOD','FLESH','SKULL','TOOTH','EAGLE','SNAKE','MOUSE','TIGER','WHALE'],
    ['CASTLE','FREEZE','GARDEN','MENTAL','ORIGIN','PUZZLE','ROCKET','SILVER','TEMPLE','WIZARD','BINARY','CARBON','FRACTAL','MOSAIC','SPHINX','NATURE','PLANET','GALAXY','METEOR','COMET','ENERGY','PROTON','NEUTRON','OXYGEN','COPPER','BRONZE','FOREST','DESERT','CANYON','ISLAND','VOLCANO','TUNDRA','GLACIER','ANIMAL','MAMMAL','REPTILE','INSECT','SPIDER','BEETLE','LIZARD','TURTLE','PARROT','FALCON','PIGEON','GUITAR','VIOLIN','PIANO','DRUMS','FLUTE','TRUMPET'],
    ['BALANCE','CRYSTAL','DECRYPT','FORTUNE','GRAVITY','MACHINE','PHOENIX','SCIENCE','THEOREM','VOLCANO','SYNAPSE','QUANTUM','PRIMATE','ENTROPY','ITERATE','ANAGRAM','PATTERN','VEHICLE','TRACTOR','BICYCLE','TRAFFIC','HIGHWAY','JOURNEY','VOYAGE','EXPLORE','COMPASS','JOURNAL','LIBRARY','COLLEGE','STUDENT','TEACHER','WRITER','AUTHOR','DOCTOR','NURSE','POLICE','FARMER','PAINTER','SCULPT','SINGER','ACTOR','DIRECT','PRODUCE','CONDUCT','DESIGN','CREATE','INVENT','BUILDER','ENGINE','SYSTEM'],
    ['ABSTRACT','CALCULUS','DEXTROUS','GRAPHENE','MULTIPLY','PARADIGM','SEQUENCE','THEORIZE','VELOCITY','WHIPLASH','SPECTRUM','ELECTRON','VARIABLE','OPTIMIZE','PROTOCOL','UNIVERSE','ASTEROID','SATELLITE','TELESCOPE','RADIATION','MOLECULE','PARTICLE','CHEMICAL','REACTION','PRESSURE','KINETICS','GENETICS','BIOLOGY','ECOLOGY','ZOOLOGY','BOTANY','GEOLOGY','MINERAL','VOLCANIC','MOUNTAIN','PENINSULA','CONTINENT','GEOGRAPHY','LOCATION','LATITUDE','LONGITUDE','ELEVATION','ALTITUDE','DISTANCE','MEASURE','DIAMETER','CYLINDER','SPHERICAL','TRIANGLE','RECTANGLE']
];\;

html = html.substring(0, t_match.index) + newTopics + html.substring(t_match.index + t_match[0].length);

html = html.replace(wp_match[0], newWp);
html = html.replace(geo_match[0], newGeo);
html = html.replace(words_match[0], newWords);

fs.writeFileSync('learn/index.html', html, 'utf8');
console.log("Replaced exactly " + [t_match, wp_match, geo_match, words_match].every(e => !!e));
