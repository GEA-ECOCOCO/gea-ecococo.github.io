/* Generador de orden de pedido en PDF, sin librerías ni servidor.
   Corre en el dispositivo del cliente; no se guarda ni se envía nada. */
(function(){
  'use strict';
  var W=612,H=792,M=40;
  // Colores de marca (0-1)
  var C={carbon:[.102,.102,.102],brasa:[.91,.365,.016],crema:[.961,.941,.902],bosque:[.176,.416,.31],coco:[.42,.259,.149],gris:[.35,.32,.28],blanco:[1,1,1]};
  // Anchos Helvetica (1/1000 em) solo para caracteres usados al alinear importes; el resto se estima
  var WD={' ':278,',':278,'.':278,'0':556,'1':556,'2':556,'3':556,'4':556,'5':556,'6':556,'7':556,'8':556,'9':556,'Q':778,'×':584,'x':500,'-':333};
  function tw(s,size,bold){var w=0;for(var i=0;i<s.length;i++){var c=s.charAt(i);w+=(WD[c]!==undefined?WD[c]:(bold?580:540))}return w*size/1000}
  // Codificación WinAnsi: Latin-1 + algunos signos; lo demás se sustituye
  var EXTRA={'–':150,'—':151,'•':149,'×':215,'·':183,'“':147,'”':148,'‘':145,'’':146,'…':133,'€':128};
  function enc(s){
    var o='';
    for(var i=0;i<s.length;i++){
      var ch=s.charAt(i),n=s.charCodeAt(i);
      if(EXTRA[ch]!==undefined)n=EXTRA[ch];
      else if(n>255||n<32)n=63;
      if(ch==='('||ch==='\\'||ch===')')o+='\\'+ch;
      else if(n<32||n>126)o+='\\'+('00'+n.toString(8)).slice(-3);
      else o+=ch;
    }
    return o;
  }
  function col(a){return a[0].toFixed(3)+' '+a[1].toFixed(3)+' '+a[2].toFixed(3)}
  function Doc(){this.s=[]}
  Doc.prototype.rect=function(x,y,w,h,fill){this.s.push(col(fill)+' rg '+x+' '+(H-y-h)+' '+w+' '+h+' re f')};
/*LOGO-START (generado por brand/make_pdf_logo.py; no editar a mano)*/
  var LG={vb:[-124, -168, 976.1999999999999, 292],sw:22,arc:'76.60 -64.28 m 45.41 -101.45 -7.97 -110.87 -50.00 -86.60 c -92.03 -62.34 -110.57 -11.40 -93.97 34.20 c -77.37 79.80 -30.43 106.91 17.36 98.48 c 65.16 90.05 100.00 48.53 100.00 0.00 c',bar:'6.00 -11.00 105.00 22.00 re',leaf:'76.60 -64.28 m 52.42 -116.78 89.79 -147.87 123.55 -152.57 c 132.44 -125.20 115.37 -83.30 76.60 -64.28 c h',rib:'80.36 -71.34 m 116.29 -142.84 l',eco:'217.96 -54.80 m 217.96 -37.76 l 245.44 -37.76 l 245.44 -21.92 l 217.96 -21.92 l 217.96 -3.44 l 249.04 -3.44 l 249.04 13.00 l 197.44 13.00 l 197.44 -71.24 l 249.04 -71.24 l 249.04 -54.80 l h 306.24 -72.20 m 316.24 -72.20 324.80 -69.56 331.92 -64.28 c 339.04 -59.00 343.80 -51.80 346.20 -42.68 c 323.64 -42.68 l 321.96 -46.20 319.58 -48.88 316.50 -50.72 c 313.42 -52.56 309.92 -53.48 306.00 -53.48 c 299.68 -53.48 294.56 -51.28 290.64 -46.88 c 286.72 -42.48 284.76 -36.60 284.76 -29.24 c 284.76 -21.88 286.72 -16.00 290.64 -11.60 c 294.56 -7.20 299.68 -5.00 306.00 -5.00 c 309.92 -5.00 313.42 -5.92 316.50 -7.76 c 319.58 -9.60 321.96 -12.28 323.64 -15.80 c 346.20 -15.80 l 343.80 -6.68 339.04 0.50 331.92 5.74 c 324.80 10.98 316.24 13.60 306.24 13.60 c 298.08 13.60 290.78 11.78 284.34 8.14 c 277.90 4.50 272.88 -0.56 269.28 -7.04 c 265.68 -13.52 263.88 -20.92 263.88 -29.24 c 263.88 -37.56 265.68 -44.98 269.28 -51.50 c 272.88 -58.02 277.90 -63.10 284.34 -66.74 c 290.78 -70.38 298.08 -72.20 306.24 -72.20 c h 360.32 -29.36 m 360.32 -37.60 362.26 -45.00 366.14 -51.56 c 370.02 -58.12 375.26 -63.24 381.86 -66.92 c 388.46 -70.60 395.72 -72.44 403.64 -72.44 c 411.56 -72.44 418.82 -70.60 425.42 -66.92 c 432.02 -63.24 437.22 -58.12 441.02 -51.56 c 444.82 -45.00 446.72 -37.60 446.72 -29.36 c 446.72 -21.12 444.80 -13.70 440.96 -7.10 c 437.12 -0.50 431.92 4.64 425.36 8.32 c 418.80 12.00 411.56 13.84 403.64 13.84 c 395.72 13.84 388.46 12.00 381.86 8.32 c 375.26 4.64 370.02 -0.50 366.14 -7.10 c 362.26 -13.70 360.32 -21.12 360.32 -29.36 c h 425.84 -29.36 m 425.84 -36.80 423.82 -42.74 419.78 -47.18 c 415.74 -51.62 410.36 -53.84 403.64 -53.84 c 396.84 -53.84 391.42 -51.64 387.38 -47.24 c 383.34 -42.84 381.32 -36.88 381.32 -29.36 c 381.32 -21.92 383.34 -15.98 387.38 -11.54 c 391.42 -7.10 396.84 -4.88 403.64 -4.88 c 410.36 -4.88 415.74 -7.12 419.78 -11.60 c 423.82 -16.08 425.84 -22.00 425.84 -29.36 c h',coco:'502.00 -72.20 m 512.00 -72.20 520.56 -69.56 527.68 -64.28 c 534.80 -59.00 539.56 -51.80 541.96 -42.68 c 519.40 -42.68 l 517.72 -46.20 515.34 -48.88 512.26 -50.72 c 509.18 -52.56 505.68 -53.48 501.76 -53.48 c 495.44 -53.48 490.32 -51.28 486.40 -46.88 c 482.48 -42.48 480.52 -36.60 480.52 -29.24 c 480.52 -21.88 482.48 -16.00 486.40 -11.60 c 490.32 -7.20 495.44 -5.00 501.76 -5.00 c 505.68 -5.00 509.18 -5.92 512.26 -7.76 c 515.34 -9.60 517.72 -12.28 519.40 -15.80 c 541.96 -15.80 l 539.56 -6.68 534.80 0.50 527.68 5.74 c 520.56 10.98 512.00 13.60 502.00 13.60 c 493.84 13.60 486.54 11.78 480.10 8.14 c 473.66 4.50 468.64 -0.56 465.04 -7.04 c 461.44 -13.52 459.64 -20.92 459.64 -29.24 c 459.64 -37.56 461.44 -44.98 465.04 -51.50 c 468.64 -58.02 473.66 -63.10 480.10 -66.74 c 486.54 -70.38 493.84 -72.20 502.00 -72.20 c h 556.08 -29.36 m 556.08 -37.60 558.02 -45.00 561.90 -51.56 c 565.78 -58.12 571.02 -63.24 577.62 -66.92 c 584.22 -70.60 591.48 -72.44 599.40 -72.44 c 607.32 -72.44 614.58 -70.60 621.18 -66.92 c 627.78 -63.24 632.98 -58.12 636.78 -51.56 c 640.58 -45.00 642.48 -37.60 642.48 -29.36 c 642.48 -21.12 640.56 -13.70 636.72 -7.10 c 632.88 -0.50 627.68 4.64 621.12 8.32 c 614.56 12.00 607.32 13.84 599.40 13.84 c 591.48 13.84 584.22 12.00 577.62 8.32 c 571.02 4.64 565.78 -0.50 561.90 -7.10 c 558.02 -13.70 556.08 -21.12 556.08 -29.36 c h 621.60 -29.36 m 621.60 -36.80 619.58 -42.74 615.54 -47.18 c 611.50 -51.62 606.12 -53.84 599.40 -53.84 c 592.60 -53.84 587.18 -51.64 583.14 -47.24 c 579.10 -42.84 577.08 -36.88 577.08 -29.36 c 577.08 -21.92 579.10 -15.98 583.14 -11.54 c 587.18 -7.10 592.60 -4.88 599.40 -4.88 c 606.12 -4.88 611.50 -7.12 615.54 -11.60 c 619.58 -16.08 621.60 -22.00 621.60 -29.36 c h 697.76 -72.20 m 707.76 -72.20 716.32 -69.56 723.44 -64.28 c 730.56 -59.00 735.32 -51.80 737.72 -42.68 c 715.16 -42.68 l 713.48 -46.20 711.10 -48.88 708.02 -50.72 c 704.94 -52.56 701.44 -53.48 697.52 -53.48 c 691.20 -53.48 686.08 -51.28 682.16 -46.88 c 678.24 -42.48 676.28 -36.60 676.28 -29.24 c 676.28 -21.88 678.24 -16.00 682.16 -11.60 c 686.08 -7.20 691.20 -5.00 697.52 -5.00 c 701.44 -5.00 704.94 -5.92 708.02 -7.76 c 711.10 -9.60 713.48 -12.28 715.16 -15.80 c 737.72 -15.80 l 735.32 -6.68 730.56 0.50 723.44 5.74 c 716.32 10.98 707.76 13.60 697.76 13.60 c 689.60 13.60 682.30 11.78 675.86 8.14 c 669.42 4.50 664.40 -0.56 660.80 -7.04 c 657.20 -13.52 655.40 -20.92 655.40 -29.24 c 655.40 -37.56 657.20 -44.98 660.80 -51.50 c 664.40 -58.02 669.42 -63.10 675.86 -66.74 c 682.30 -70.38 689.60 -72.20 697.76 -72.20 c h 751.84 -29.36 m 751.84 -37.60 753.78 -45.00 757.66 -51.56 c 761.54 -58.12 766.78 -63.24 773.38 -66.92 c 779.98 -70.60 787.24 -72.44 795.16 -72.44 c 803.08 -72.44 810.34 -70.60 816.94 -66.92 c 823.54 -63.24 828.74 -58.12 832.54 -51.56 c 836.34 -45.00 838.24 -37.60 838.24 -29.36 c 838.24 -21.12 836.32 -13.70 832.48 -7.10 c 828.64 -0.50 823.44 4.64 816.88 8.32 c 810.32 12.00 803.08 13.84 795.16 13.84 c 787.24 13.84 779.98 12.00 773.38 8.32 c 766.78 4.64 761.54 -0.50 757.66 -7.10 c 753.78 -13.70 751.84 -21.12 751.84 -29.36 c h 817.36 -29.36 m 817.36 -36.80 815.34 -42.74 811.30 -47.18 c 807.26 -51.62 801.88 -53.84 795.16 -53.84 c 788.36 -53.84 782.94 -51.64 778.90 -47.24 c 774.86 -42.84 772.84 -36.88 772.84 -29.36 c 772.84 -21.92 774.86 -15.98 778.90 -11.54 c 782.94 -7.10 788.36 -4.88 795.16 -4.88 c 801.88 -4.88 807.26 -7.12 811.30 -11.60 c 815.34 -16.08 817.36 -22.00 817.36 -29.36 c h',sub:'211.07 54.66 m 210.48 53.52 209.66 52.66 208.60 52.07 c 207.54 51.49 206.32 51.20 204.94 51.20 c 203.42 51.20 202.06 51.54 200.88 52.22 c 199.69 52.90 198.76 53.87 198.09 55.13 c 197.42 56.38 197.08 57.83 197.08 59.48 c 197.08 61.13 197.42 62.59 198.09 63.86 c 198.76 65.12 199.69 66.09 200.88 66.78 c 202.06 67.46 203.42 67.80 204.94 67.80 c 206.98 67.80 208.64 67.23 209.92 66.08 c 211.19 64.94 211.98 63.39 212.26 61.43 c 203.65 61.43 l 203.65 58.43 l 216.29 58.43 l 216.29 61.36 l 216.05 63.15 215.41 64.79 214.39 66.28 c 213.37 67.78 212.04 68.97 210.40 69.86 c 208.76 70.75 206.94 71.20 204.94 71.20 c 202.78 71.20 200.81 70.70 199.03 69.70 c 197.25 68.70 195.83 67.30 194.79 65.52 c 193.74 63.74 193.22 61.73 193.22 59.48 c 193.22 57.24 193.74 55.23 194.79 53.44 c 195.83 51.66 197.25 50.27 199.05 49.27 c 200.84 48.27 202.80 47.77 204.94 47.77 c 207.38 47.77 209.55 48.37 211.45 49.57 c 213.36 50.77 214.74 52.46 215.59 54.66 c h 272.41 51.10 m 272.41 57.83 l 280.33 57.83 l 280.33 60.90 l 272.41 60.90 l 272.41 67.93 l 281.32 67.93 l 281.32 71.00 l 268.65 71.00 l 268.65 48.03 l 281.32 48.03 l 281.32 51.10 l h 348.44 66.31 m 338.83 66.31 l 337.18 71.00 l 333.26 71.00 l 341.47 48.03 l 345.83 48.03 l 354.05 71.00 l 350.09 71.00 l h 347.38 63.24 m 343.65 52.59 l 339.89 63.24 l h 473.98 47.77 m 476.43 47.77 478.60 48.37 480.50 49.57 c 482.40 50.77 483.78 52.46 484.64 54.66 c 480.12 54.66 l 479.53 53.45 478.70 52.55 477.65 51.96 c 476.59 51.36 475.37 51.07 473.98 51.07 c 472.47 51.07 471.11 51.41 469.92 52.09 c 468.74 52.77 467.81 53.75 467.14 55.03 c 466.46 56.30 466.13 57.79 466.13 59.48 c 466.13 61.18 466.46 62.66 467.14 63.94 c 467.81 65.21 468.74 66.20 469.92 66.89 c 471.11 67.58 472.47 67.93 473.98 67.93 c 475.37 67.93 476.59 67.63 477.65 67.04 c 478.70 66.45 479.53 65.54 480.12 64.33 c 484.64 64.33 l 483.78 66.53 482.40 68.23 480.50 69.42 c 478.60 70.60 476.43 71.20 473.98 71.20 c 471.83 71.20 469.86 70.70 468.08 69.70 c 466.29 68.70 464.88 67.30 463.84 65.52 c 462.79 63.74 462.27 61.73 462.27 59.48 c 462.27 57.24 462.79 55.23 463.84 53.44 c 464.88 51.66 466.30 50.27 468.09 49.27 c 469.89 48.27 471.85 47.77 473.98 47.77 c h 551.52 66.31 m 541.92 66.31 l 540.27 71.00 l 536.34 71.00 l 544.56 48.03 l 548.92 48.03 l 557.13 71.00 l 553.17 71.00 l h 550.47 63.24 m 546.74 52.59 l 542.98 63.24 l h 621.28 71.00 m 616.00 61.83 l 613.13 61.83 l 613.13 71.00 l 609.37 71.00 l 609.37 48.06 l 617.28 48.06 l 619.04 48.06 620.54 48.37 621.76 48.99 c 622.98 49.60 623.89 50.43 624.50 51.46 c 625.10 52.50 625.40 53.65 625.40 54.93 c 625.40 56.43 624.97 57.78 624.10 59.00 c 623.23 60.23 621.89 61.06 620.09 61.50 c 625.77 71.00 l h 613.13 58.82 m 617.28 58.82 l 618.69 58.82 619.75 58.47 620.47 57.77 c 621.18 57.06 621.54 56.12 621.54 54.93 c 621.54 53.74 621.19 52.81 620.49 52.14 c 619.78 51.47 618.71 51.13 617.28 51.13 c 613.13 51.13 l h 695.59 64.83 m 695.59 66.00 695.28 67.05 694.68 67.98 c 694.07 68.92 693.20 69.65 692.05 70.19 c 690.91 70.73 689.58 71.00 688.06 71.00 c 678.89 71.00 l 678.89 48.06 l 687.63 48.06 l 689.19 48.06 690.54 48.33 691.66 48.86 c 692.78 49.38 693.63 50.09 694.20 50.99 c 694.77 51.88 695.06 52.87 695.06 53.97 c 695.06 55.29 694.71 56.39 694.00 57.27 c 693.30 58.15 692.35 58.80 691.16 59.22 c 692.40 59.44 693.44 60.09 694.30 61.17 c 695.16 62.24 695.59 63.46 695.59 64.83 c h 682.65 57.70 m 687.30 57.70 l 688.53 57.70 689.50 57.42 690.19 56.86 c 690.88 56.30 691.23 55.49 691.23 54.43 c 691.23 53.40 690.88 52.59 690.19 52.01 c 689.50 51.43 688.53 51.13 687.30 51.13 c 682.65 51.13 l h 691.82 64.43 m 691.82 63.31 691.44 62.42 690.67 61.76 c 689.90 61.10 688.88 60.77 687.60 60.77 c 682.65 60.77 l 682.65 67.93 l 687.73 67.93 l 689.01 67.93 690.01 67.62 690.73 67.01 c 691.46 66.39 691.82 65.53 691.82 64.43 c h 747.09 59.48 m 747.09 57.24 747.61 55.23 748.66 53.44 c 749.70 51.66 751.12 50.27 752.91 49.27 c 754.71 48.27 756.67 47.77 758.80 47.77 c 760.96 47.77 762.94 48.27 764.73 49.27 c 766.52 50.27 767.93 51.66 768.97 53.44 c 770.00 55.23 770.52 57.24 770.52 59.48 c 770.52 61.73 770.00 63.75 768.97 65.54 c 767.93 67.33 766.52 68.73 764.73 69.73 c 762.94 70.73 760.96 71.23 758.80 71.23 c 756.67 71.23 754.71 70.73 752.91 69.73 c 751.12 68.73 749.70 67.33 748.66 65.54 c 747.61 63.75 747.09 61.73 747.09 59.48 c h 766.66 59.48 m 766.66 57.79 766.32 56.30 765.65 55.03 c 764.98 53.75 764.05 52.77 762.86 52.09 c 761.68 51.41 760.32 51.07 758.80 51.07 c 757.29 51.07 755.93 51.41 754.75 52.09 c 753.56 52.77 752.63 53.75 751.96 55.03 c 751.29 56.30 750.95 57.79 750.95 59.48 c 750.95 61.18 751.29 62.67 751.96 63.95 c 752.63 65.24 753.56 66.23 754.75 66.92 c 755.93 67.62 757.29 67.96 758.80 67.96 c 760.32 67.96 761.68 67.62 762.86 66.92 c 764.05 66.23 764.98 65.24 765.65 63.95 c 766.32 62.67 766.66 61.18 766.66 59.48 c h 762.20 43.15 m 754.91 46.75 l 754.91 43.97 l 762.20 39.95 l h 841.72 71.00 m 837.96 71.00 l 826.64 53.87 l 826.64 71.00 l 822.88 71.00 l 822.88 48.03 l 826.64 48.03 l 837.96 65.13 l 837.96 48.03 l 841.72 48.03 l h',
    v:{blanco:{g:[1,1,1],lf:[.714,.949,.235],eco:[.714,.949,.235],coco:[1,.478,.102],sub:[.827,.886,.839]},
       color:{g:[.043,.302,.122],lf:[.122,.635,.227],eco:[.122,.635,.227],coco:[.91,.38,.039],sub:[.29,.388,.314]},
       negro:{g:[.067,.067,.067],lf:[.067,.067,.067],eco:[.067,.067,.067],coco:[.067,.067,.067],sub:[.067,.067,.067]}}};
  /* Logotipo oficial ECOCOCO · GEA Carbón en vectores: logo(x,y,ancho,variante,colorDeFondo) */
  Doc.prototype.logo=function(x,y,wd,v,bg){
    var sc=wd/LG.vb[2],c=LG.v[v||'color'],e=x-LG.vb[0]*sc,f=H-y+LG.vb[1]*sc,o=[];
    o.push('q '+sc.toFixed(5)+' 0 0 '+(-sc).toFixed(5)+' '+e.toFixed(2)+' '+f.toFixed(2)+' cm');
    o.push(col(c.g)+' RG '+LG.sw+' w 0 J '+LG.arc+' S');
    o.push(col(c.g)+' rg '+LG.bar+' f');
    o.push(col(c.lf)+' rg '+LG.leaf+' f');
    if(bg)o.push(col(bg)+' RG 3.6 w 1 J '+LG.rib+' S');
    o.push(col(c.eco)+' rg '+LG.eco+' f');o.push(col(c.coco)+' rg '+LG.coco+' f');o.push(col(c.sub)+' rg '+LG.sub+' f');
    o.push('Q');this.s.push(o.join(' '));
  };
  Doc.prototype.logoH=function(wd){return wd*LG.vb[3]/LG.vb[2]};
/*LOGO-END*/
  Doc.prototype.line=function(x1,y1,x2,y2,c,lw){this.s.push(col(c)+' RG '+(lw||.7)+' w '+x1+' '+(H-y1)+' m '+x2+' '+(H-y2)+' l S')};
  Doc.prototype.text=function(s,x,y,size,o){
    o=o||{};var f=o.bold?'F2':'F1',w=tw(s,size,o.bold);
    if(o.right)x=x-w;else if(o.center)x=x-w/2;
    this.s.push('BT /'+f+' '+size+' Tf '+col(o.color||C.carbon)+' rg '+x.toFixed(2)+' '+(H-y).toFixed(2)+' Td ('+enc(s)+') Tj ET');
  };
  // Parte el texto en líneas que quepan en maxW (estimación conservadora)
  function wrap(s,size,maxW,bold){
    var words=String(s).split(/\s+/),lines=[],cur='';
    words.forEach(function(w){
      var t=cur?cur+' '+w:w;
      if(tw(t,size,bold)<=maxW)cur=t;
      else{if(cur)lines.push(cur);cur=w}
    });
    if(cur)lines.push(cur);
    return lines;
  }
  function build(doc){
    var objs=[],content=doc.s.join('\n');
    function add(s){objs.push(s);return objs.length}
    add('<< /Type /Catalog /Pages 2 0 R >>');
    add('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+W+' '+H+'] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>');
    add('<< /Length '+content.length+' >>\nstream\n'+content+'\nendstream');
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    var out='%PDF-1.4\n',off=[];
    objs.forEach(function(o,i){off.push(out.length);out+=(i+1)+' 0 obj\n'+o+'\nendobj\n'});
    var x=out.length;
    out+='xref\n0 '+(objs.length+1)+'\n0000000000 65535 f \n';
    off.forEach(function(n){out+=('0000000000'+n).slice(-10)+' 00000 n \n'});
    out+='trailer\n<< /Size '+(objs.length+1)+' /Root 1 0 R >>\nstartxref\n'+x+'\n%%EOF';
    // content solo usa caracteres <=255 (enc escapa el resto) => bytes = caracteres
    var u=new Uint8Array(out.length);for(var i=0;i<out.length;i++)u[i]=out.charCodeAt(i)&255;
    return new Blob([u],{type:'application/pdf'});
  }
  function money(n){
    var p=(Math.round(n*100)/100).toFixed(2).split('.');
    return 'Q'+p[0].replace(/\B(?=(\d{3})+(?!\d))/g,',')+'.'+p[1];
  }
  function pad(n){return (n<10?'0':'')+n}

  // d: {en, no, fecha, cli:{nom,tel,dep,mun,zon,dir,ref,nota}, items:[{cod,nom,cant,p}], bulto}
  window.geaOrdenPDF=function(d){
    var L=function(es,en){return d.en?en:es};
    var doc=new Doc(),y;
    // Cabecera
    doc.rect(0,0,W,96,C.carbon);
    doc.rect(0,96,W,4,C.brasa);
    doc.logo(M,12,232,'blanco',C.carbon);
    doc.text('GEA Grupo Empresarial Armas · Retalhuleu, Guatemala',M,92,8,{color:[.85,.8,.72]});
    doc.text(L('ORDEN DE PEDIDO / COTIZACIÓN','ORDER / QUOTE'),W-M,40,13,{bold:true,color:C.brasa,right:true});
    doc.text(L('N.º ','No. ')+d.no,W-M,58,11,{bold:true,color:C.crema,right:true});
    doc.text(L('Fecha: ','Date: ')+d.fecha,W-M,74,10,{color:[.85,.8,.72],right:true});
    y=126;
    // Datos del cliente
    doc.text(L('DATOS DEL CLIENTE Y ENTREGA','CUSTOMER AND DELIVERY DETAILS'),M,y,10,{bold:true,color:C.bosque});
    doc.line(M,y+6,W-M,y+6,C.bosque,1);y+=24;
    var c=d.cli||{};
    var rows=[[L('Nombre','Name'),c.nom],[L('Teléfono','Phone'),c.tel],
      [L('Departamento / Municipio','Department / Town'),[c.dep,c.mun].filter(Boolean).join(' / ')],
      [L('Colonia, lotificación, sección o zona','Neighborhood, subdivision, section or zone'),c.zon],
      [L('Calle o avenida y N.º de casa o lote','Street or avenue and house or lot no.'),c.dir],
      [L('Referencia','Landmark'),c.ref]];
    if(c.nit)rows.push([L('NIT para factura','Tax ID (NIT) for invoice'),c.nit]);
    if(c.nota)rows.push([L('Notas','Notes'),c.nota]);
    rows.forEach(function(r){
      if(!r[1])return;
      doc.text(r[0],M,y,8.5,{color:C.gris});
      var ls=wrap(r[1],10.5,W-M-210);
      ls.forEach(function(l,i){doc.text(l,210,y+i*13,10.5,{bold:true})});
      y+=Math.max(1,ls.length)*13+5;
    });
    y+=8;
    // Tabla de productos
    var x1=M,x2=M+78,x3=W-M-190,x4=W-M-110,x5=W-M;
    doc.rect(M,y,W-2*M,24,C.carbon);
    doc.text(L('CÓDIGO','CODE'),x1+8,y+16,9,{bold:true,color:C.crema});
    doc.text(L('DESCRIPCIÓN','DESCRIPTION'),x2,y+16,9,{bold:true,color:C.crema});
    doc.text(L('CANT.','QTY'),x3,y+16,9,{bold:true,color:C.crema,right:true});
    doc.text(L('PRECIO UNIT.','UNIT PRICE'),x4,y+16,9,{bold:true,color:C.crema,right:true});
    doc.text(L('SUBTOTAL','SUBTOTAL'),x5-8,y+16,9,{bold:true,color:C.crema,right:true});
    y+=24;
    var total=0;
    d.items.forEach(function(it,i){
      var sub=it.cant*it.p;total+=sub;
      doc.rect(M,y,W-2*M,28,i%2?C.blanco:C.crema);
      doc.text(it.cod||'',x1+8,y+18,9.5,{color:C.gris});
      doc.text(it.nom,x2,y+18,10.5,{bold:true});
      doc.text(String(it.cant),x3,y+18,10.5,{right:true});
      doc.text(money(it.p),x4,y+18,10.5,{right:true});
      doc.text(money(sub),x5-8,y+18,10.5,{bold:true,right:true});
      y+=28;
    });
    doc.line(M,y,W-M,y,C.carbon,1);
    y+=22;
    // Totales
    var tx=W-M-8;
    doc.text(L('Subtotal productos','Products subtotal'),W-M-190,y,10.5,{color:C.gris});
    doc.text(money(total),tx,y,10.5,{right:true});y+=18;
    doc.text(L('Flete / envío','Shipping'),W-M-190,y,10.5,{color:C.gris});
    doc.text(L('Por confirmar','To be confirmed'),tx,y,10.5,{right:true});y+=10;
    doc.rect(W-M-200,y,200,32,C.carbon);
    doc.text(L('TOTAL ESTIMADO','ESTIMATED TOTAL'),W-M-190,y+21,10,{bold:true,color:C.crema});
    doc.text(money(total),tx,y+22,14,{bold:true,color:C.brasa,right:true});
    var fx=d.fx&&d.fx.r?d.fx.r:7.65;
    doc.text(L('Equivalente aprox. en US$','Approx. equivalent in US$'),W-M-190,y+48,9.5,{color:C.gris});
    doc.text('US$'+(Math.round(total/fx*100)/100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,','),tx,y+48,10.5,{bold:true,right:true});
    y+=74;
    // Condiciones
    doc.text(L('CONDICIONES','TERMS'),M,y,10,{bold:true,color:C.bosque});
    doc.line(M,y+6,W-M,y+6,C.bosque,1);y+=24;
    var T=[L('Precio a consumidor final.','End-consumer price.')];
    if(d.bulto)T.push(L('En bultos de 25 kg hay precio especial según el volumen, que se confirma por WhatsApp.','For 25 kg sacks there is a special volume price, confirmed on WhatsApp.'));
    T.push(L('Tipo de cambio de referencia: Q'+fx.toFixed(2)+' por US$1'+(d.fx&&d.fx.d?' ('+d.fx.d+')':'')+'. El monto en dólares es aproximado; el cobro es en quetzales.','Reference exchange rate: Q'+fx.toFixed(2)+' per US$1'+(d.fx&&d.fx.d?' ('+d.fx.d+')':'')+'. USD amounts are approximate; payment is in quetzales.'));
    T.push(L('El flete, la entrega y la forma de pago se coordinan con GEA Carbón antes de concretar el pedido.','Shipping, delivery and payment are arranged with GEA Carbón before the order is confirmed.'));
    T.push(L('Este documento es una orden de pedido o cotización informativa y no constituye una factura. Los precios y la disponibilidad se confirman al momento del pedido.','This document is an informational order or quote and is not an invoice. Prices and availability are confirmed when the order is placed.'));
    T.forEach(function(t){
      wrap(t,9.5,W-2*M-14).forEach(function(l,i){
        if(i===0)doc.text('•',M+2,y,9.5,{color:C.brasa,bold:true});
        doc.text(l,M+14,y,9.5,{color:C.carbon});y+=13});
      y+=3;
    });
    // Pie
    doc.rect(0,H-70,W,70,C.carbon);
    doc.rect(0,H-70,W,3,C.brasa);
    doc.text(L('Para enviar o confirmar este pedido: WhatsApp +502 4279-4894','To send or confirm this order: WhatsApp +502 4279-4894'),M,H-44,10,{bold:true,color:C.crema});
    doc.text('geaecococo.ventas@gmail.com  ·  gea-ecococo.github.io',M,H-28,9.5,{color:[.85,.8,.72]});
    doc.text('ECOCOCO · GEA Carbón',W-M,H-28,9.5,{color:[.85,.8,.72],right:true});
    return build(doc);
  };

  // Número de orden: ECO-AAAAMMDD-HHMM (fecha y hora local de generación)
  window.geaOrdenNo=function(){
    var n=new Date();
    return 'ECO-'+n.getFullYear()+pad(n.getMonth()+1)+pad(n.getDate())+'-'+pad(n.getHours())+pad(n.getMinutes());
  };
  window.geaOrdenFecha=function(en){
    var n=new Date(),m=en?['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']:['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return pad(n.getDate())+' '+m[n.getMonth()]+' '+n.getFullYear();
  };

  // Solicitud de factura FEL / proforma. d: {en,no,fecha,emisor:{nom,nit,dir,tel,mail},cli:{tipo,nom,nit,dir,mail,tel,dep,mun,ref,nota},items:[{cod,nom,cant,p}],fx}
  window.geaFacturaPDF=function(d){
    var L=function(es,en){return d.en?en:es};
    var doc=new Doc(),y,e=d.emisor||{},c=d.cli||{};
    doc.rect(0,0,W,96,C.carbon);doc.rect(0,96,W,4,C.brasa);
    doc.logo(M,12,232,'blanco',C.carbon);
    doc.text('GEA Grupo Empresarial Armas · Retalhuleu, Guatemala',M,92,8,{color:[.85,.8,.72]});
    doc.text(L('SOLICITUD DE FACTURA FEL · PROFORMA','FEL INVOICE REQUEST · PROFORMA'),W-M,40,12,{bold:true,color:C.brasa,right:true});
    doc.text(L('N.º ','No. ')+d.no,W-M,58,11,{bold:true,color:C.crema,right:true});
    doc.text(L('Fecha: ','Date: ')+d.fecha,W-M,74,10,{color:[.85,.8,.72],right:true});
    y=124;
    function sec(t){doc.text(t,M,y,10,{bold:true,color:C.bosque});doc.line(M,y+6,W-M,y+6,C.bosque,1);y+=22}
    function row(k,v){if(!v)return;doc.text(k,M,y,8.5,{color:C.gris});var ls=wrap(v,10.5,W-M-210);ls.forEach(function(l,i){doc.text(l,210,y+i*13,10.5,{bold:true})});y+=Math.max(1,ls.length)*13+5}
    sec(L('EMISOR','ISSUER'));
    row(L('Razón social','Company'),e.nom);row(L('NIT del emisor','Issuer tax ID (NIT)'),e.nit);row(L('Ubicación','Location'),e.dir);
    row(L('Contacto','Contact'),[e.tel,e.mail].filter(Boolean).join('  ·  '));
    y+=8;sec(L('DATOS PARA LA FACTURA (RECEPTOR)','INVOICE DETAILS (RECIPIENT)'));
    row(L('Nombre o razón social','Name or company'),c.nom);
    row(L('NIT del cliente','Customer tax ID (NIT)'),c.tipo==='cf'?L('CF (consumidor final)','CF (end consumer)'):c.nit);
    row(L('Dirección fiscal','Tax address'),c.dir);row(L('Correo para recibir la factura','Email to receive the invoice'),c.mail);
    row(L('Teléfono','Phone'),c.tel);row(L('Entrega (departamento / municipio)','Delivery (department / town)'),[c.dep,c.mun].filter(Boolean).join(' / '));
    row(L('Referencia de pedido o pago','Order or payment reference'),c.ref);row(L('Observaciones','Notes'),c.nota);
    y+=8;
    var x1=M,x2=M+78,x3=W-M-190,x4=W-M-110,x5=W-M;
    doc.rect(M,y,W-2*M,24,C.carbon);
    doc.text(L('CÓDIGO','CODE'),x1+8,y+16,9,{bold:true,color:C.crema});doc.text(L('DESCRIPCIÓN','DESCRIPTION'),x2,y+16,9,{bold:true,color:C.crema});
    doc.text(L('CANT.','QTY'),x3,y+16,9,{bold:true,color:C.crema,right:true});doc.text(L('PRECIO UNIT.','UNIT PRICE'),x4,y+16,9,{bold:true,color:C.crema,right:true});
    doc.text('SUBTOTAL',x5-8,y+16,9,{bold:true,color:C.crema,right:true});y+=24;
    var total=0;
    d.items.forEach(function(it,i){var sub=it.cant*it.p;total+=sub;doc.rect(M,y,W-2*M,28,i%2?C.blanco:C.crema);
      doc.text(it.cod||'',x1+8,y+18,9.5,{color:C.gris});doc.text(it.nom,x2,y+18,10.5,{bold:true});doc.text(String(it.cant),x3,y+18,10.5,{right:true});
      doc.text(money(it.p),x4,y+18,10.5,{right:true});doc.text(money(sub),x5-8,y+18,10.5,{bold:true,right:true});y+=28});
    doc.line(M,y,W-M,y,C.carbon,1);y+=20;
    var tx=W-M-8;
    doc.text(L('Flete / envío','Shipping'),W-M-190,y,10.5,{color:C.gris});doc.text(L('Por confirmar','To be confirmed'),tx,y,10.5,{right:true});y+=10;
    doc.rect(W-M-200,y,200,32,C.carbon);doc.text(L('TOTAL ESTIMADO','ESTIMATED TOTAL'),W-M-190,y+21,10,{bold:true,color:C.crema});
    doc.text(money(total),tx,y+22,14,{bold:true,color:C.brasa,right:true});
    var fx=d.fx&&d.fx.r?d.fx.r:7.65;
    if(d.en){doc.text('Approx. equivalent in US$',W-M-190,y+48,9.5,{color:C.gris});doc.text('US$'+(Math.round(total/fx*100)/100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g,','),tx,y+48,10.5,{bold:true,right:true});y+=18}
    y+=56;sec(L('IMPORTANTE','IMPORTANT'));
    var T=[L('Este documento es una proforma informativa con tus datos fiscales y el detalle del pedido. No es la factura.','This document is an informational proforma with your tax details and the order breakdown. It is not the invoice.'),
      L('La factura electrónica FEL se emite al confirmar el pedido y el pago, y se envía al correo indicado. El desglose de impuestos aparece en la factura.','The FEL electronic invoice is issued once the order and payment are confirmed, and is sent to the email provided. The tax breakdown appears on the invoice.'),
      L('Revisa que tu nombre y NIT coincidan con tu registro tributario: una vez emitida, la factura no puede modificarse.','Check that your name and NIT match your tax registration: once issued, the invoice cannot be edited.'),
      L('Precios en quetzales; el flete, la entrega y la forma de pago se coordinan con GEA Carbón antes de concretar el pedido.','Prices in quetzales; shipping, delivery and payment are arranged with GEA Carbón before the order is final.')];
    if(d.en)T.push('Reference exchange rate: Q'+fx.toFixed(2)+' per US$1'+(d.fx&&d.fx.d?' ('+d.fx.d+')':'')+'. The US$ amount is approximate.');
    T.forEach(function(t){wrap(t,9.5,W-2*M-14).forEach(function(l,i){if(i===0)doc.text('•',M+2,y,9.5,{color:C.brasa,bold:true});doc.text(l,M+14,y,9.5,{color:C.carbon});y+=13});y+=3});
    doc.rect(0,H-70,W,70,C.carbon);doc.rect(0,H-70,W,3,C.brasa);
    doc.text(L('Para enviar esta solicitud: WhatsApp +502 4279-4894','To send this request: WhatsApp +502 4279-4894'),M,H-44,10,{bold:true,color:C.crema});
    doc.text('geaecococo.ventas@gmail.com  ·  gea-ecococo.github.io',M,H-28,9.5,{color:[.85,.8,.72]});
    doc.text('ECOCOCO · GEA Carbón',W-M,H-28,9.5,{color:[.85,.8,.72],right:true});
    return build(doc);
  };
  window.geaFacturaNo=function(){var n=new Date();return 'PF-'+n.getFullYear()+pad(n.getMonth()+1)+pad(n.getDate())+'-'+pad(n.getHours())+pad(n.getMinutes())+pad(n.getSeconds())};
  /* ---- GEA Consultora: cotización del paquete (varias páginas, sin servidor) ---- */
  function buildN(docs){
    var objs=[];function add(x){objs.push(x);return objs.length}
    var n=docs.length,kids=[];for(var i=0;i<n;i++)kids.push((3+i*2)+' 0 R');
    add('<< /Type /Catalog /Pages 2 0 R >>');
    add('<< /Type /Pages /Kids ['+kids.join(' ')+'] /Count '+n+' >>');
    var fo=3+n*2;
    docs.forEach(function(d,i){
      var c=d.s.join('\n');
      add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+W+' '+H+'] /Contents '+(4+i*2)+' 0 R /Resources << /Font << /F1 '+fo+' 0 R /F2 '+(fo+1)+' 0 R >> >> >>');
      add('<< /Length '+c.length+' >>\nstream\n'+c+'\nendstream');
    });
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    var out='%PDF-1.4\n',off=[];
    objs.forEach(function(o,i){off.push(out.length);out+=(i+1)+' 0 obj\n'+o+'\nendobj\n'});
    var x=out.length;out+='xref\n0 '+(objs.length+1)+'\n0000000000 65535 f \n';
    off.forEach(function(q){out+=('0000000000'+q).slice(-10)+' 00000 n \n'});
    out+='trailer\n<< /Size '+(objs.length+1)+' /Root 1 0 R >>\nstartxref\n'+x+'\n%%EOF';
    var u=new Uint8Array(out.length);for(var i=0;i<out.length;i++)u[i]=out.charCodeAt(i)&255;
    return new Blob([u],{type:'application/pdf'});
  }
  var CC={nv:[.039,.165,.247],az:[.145,.522,.773],cy:[.298,.765,1],cr:[.953,.914,.824],bg:[.933,.957,.973],gr:[.235,.353,.431],bl:[1,1,1]};
  function poly(doc,pts,fill){var o=[];pts.forEach(function(p,i){o.push(p[0].toFixed(2)+' '+(H-p[1]).toFixed(2)+(i?' l':' m'))});doc.s.push(col(fill)+' rg '+o.join(' ')+' h f')}
  function escudo(doc,x,y,k){ // escudo simple de GEA Consultora en vectores
    function P(a){return a.map(function(p){return [x+p[0]*k,y+p[1]*k]})}
    poly(doc,P([[0,6],[22,0],[44,6],[44,30],[22,54],[0,30]]),CC.cr);
    poly(doc,P([[4,9],[22,4],[40,9],[40,28],[22,48],[4,28]]),CC.nv);
    poly(doc,P([[12,36],[16,36],[16,20],[12,20]]),CC.cr);poly(doc,P([[20,40],[24,40],[24,14],[20,14]]),CC.cr);poly(doc,P([[28,36],[32,36],[32,24],[28,24]]),CC.cr);
  }
  // d: {en,no,fecha,items:[{t,pr,inc}],tot:[[etiqueta,monto]],fx:{r,d}}
  window.geaCotizacionPDF=function(d){
    var L=function(es,en){return d.en?en:es},pages=[],doc,y,fx=d.fx&&d.fx.r?d.fx.r:7.65;
    function pie(){
      doc.rect(0,H-46,W,46,CC.nv);doc.rect(0,H-46,W,3,CC.az);
      doc.text(L('Para confirmar tu cotización: WhatsApp +502 4279-4894','To confirm your quote: WhatsApp +502 4279-4894'),M,H-26,9.5,{bold:true,color:CC.cr});
      doc.text('geaecococo.ventas@gmail.com  ·  gea-ecococo.github.io',W-M,H-26,9,{color:[.78,.86,.92],right:true});
      doc.text('GEA Consultora · GEA Grupo Empresarial Armas · Retalhuleu, Guatemala',M,H-12,7.5,{color:[.6,.72,.8]});
    }
    function nueva(primera){
      doc=new Doc();pages.push(doc);
      if(primera){
        doc.rect(0,0,W,104,CC.nv);doc.rect(0,104,W,4,CC.az);escudo(doc,M,20,1.25);
        doc.text('GEA',M+66,60,34,{bold:true,color:CC.cr});doc.text('C O N S U L T O R A',M+68,76,8.5,{bold:true,color:CC.cy});
        doc.text(L('COTIZACIÓN DE SERVICIOS DIGITALES','DIGITAL SERVICES QUOTE'),W-M,40,12.5,{bold:true,color:CC.cy,right:true});
        doc.text(L('N.º ','No. ')+d.no,W-M,58,11,{bold:true,color:CC.cr,right:true});
        doc.text(L('Fecha: ','Date: ')+d.fecha+'   ·   '+L('Vigencia: 15 días','Valid for 15 days'),W-M,76,9.5,{color:[.78,.86,.92],right:true});
        doc.text('Estrategia · Tecnología · Desarrollo',W-M,92,8,{color:[.6,.72,.8],right:true});
        y=134;
      }else{
        doc.rect(0,0,W,46,CC.nv);doc.rect(0,46,W,3,CC.az);
        doc.text('GEA Consultora',M,29,13,{bold:true,color:CC.cr});
        doc.text(L('Cotización ','Quote ')+d.no+L(' (continuación)',' (continued)'),W-M,29,9.5,{color:CC.cy,right:true});
        y=74;
      }
      pie();
    }
    function cab(){
      doc.rect(M,y,W-2*M,22,CC.nv);
      doc.text(L('SERVICIO','SERVICE'),M+10,y+15,9,{bold:true,color:CC.cr});
      doc.text(L('PRECIO DE REFERENCIA','REFERENCE PRICE'),W-M-10,y+15,9,{bold:true,color:CC.cr,right:true});
      y+=22;
    }
    nueva(true);
    doc.text(L('SERVICIOS ELEGIDOS','SELECTED SERVICES'),M,y,10,{bold:true,color:CC.az});doc.line(M,y+6,W-M,y+6,CC.az,1);y+=20;
    cab();
    d.items.forEach(function(it,i){
      var ls=wrap(it.t,10.5,W-2*M-230,true),h=Math.max(26,ls.length*13+12);
      if(y+h>H-70){nueva(false);cab()}
      doc.rect(M,y,W-2*M,h,i%2?CC.bl:CC.bg);
      ls.forEach(function(l,j){doc.text(l,M+10,y+17+j*13,10.5,{bold:true})});
      doc.text(it.pr,W-M-10,y+17,9.5,{right:true,color:it.inc?CC.gr:CC.nv,bold:!it.inc});
      y+=h;
    });
    doc.line(M,y,W-M,y,CC.nv,1);y+=24;
    var nT=d.tot.length,hT=34+nT*20+26;
    if(y+hT+140>H-60){nueva(false)}
    doc.rect(W-M-300,y,300,hT,CC.nv);
    doc.text(L('TOTAL ESTIMADO','ESTIMATED TOTAL'),W-M-288,y+22,10,{bold:true,color:CC.cy});
    d.tot.forEach(function(r,i){
      doc.text(r[0],W-M-288,y+44+i*20,10,{color:CC.cr});
      doc.text(r[1],W-M-12,y+44+i*20,11,{bold:true,color:CC.cr,right:true});
    });
    doc.text(L('Tipo de cambio de referencia: Q'+fx.toFixed(2)+' por US$1','Reference exchange rate: Q'+fx.toFixed(2)+' per US$1'),W-M-288,y+hT-10,7.5,{color:[.6,.72,.8]});
    y+=hT+26;
    doc.text(L('CONDICIONES','TERMS'),M,y,10,{bold:true,color:CC.az});doc.line(M,y+6,W-M,y+6,CC.az,1);y+=22;
    var T=[L('Los precios son de referencia, en quetzales. El monto en dólares es aproximado; el cobro es en quetzales.','Prices are for reference, in quetzales. The US dollar amount is approximate; payment is in quetzales.'),
      L('El precio final se confirma por escrito después de una conversación sobre el alcance de tu proyecto.','The final price is confirmed in writing after a conversation about your project scope.'),
      L('Esta cotización informativa tiene una vigencia de 15 días desde su fecha.','This informational quote is valid for 15 days from its date.'),
      L('Dominio, alojamiento y servicios de terceros se informan aparte cuando aplican. Factura electrónica FEL.','Domain, hosting and third-party services are quoted separately when they apply. FEL electronic invoice.'),
      L('Términos de servicio y privacidad en gea-ecococo.github.io/consultora-terminos.html','Terms of service and privacy at gea-ecococo.github.io/en/consultora-terminos.html')];
    T.forEach(function(t){wrap(t,9,W-2*M-14).forEach(function(l,i){if(y>H-70){nueva(false)}if(i===0)doc.text('•',M+2,y,9,{bold:true,color:CC.az});doc.text(l,M+14,y,9,{color:CC.nv});y+=12.5});y+=3});
    return buildN(pages);
  };
  window.geaCotizacionNo=function(){var n=new Date();return 'COT-'+n.getFullYear()+pad(n.getMonth()+1)+pad(n.getDate())+'-'+pad(n.getHours())+pad(n.getMinutes())};
})();
