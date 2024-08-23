/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'

import './distribucion.css'

const Distribucion = () => {
  const [datos, setDatos] = useState([])
  const [datosInformacion, setDatosInformacion] = useState([])
  const [datosPorcentajes, setDatosPorcentajes] = useState([])
  const [datosRequerimientos, setDatosRequerimientos] = useState([])

  useEffect(() => {
    if (datos.length > 0) {
      procesarDatos(datos, datosInformacion)
    }
  }, [datos, datosInformacion])

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    const reader = new FileReader()

    reader.onload = (e) => {
      const filedatos = new Uint8Array(e.target.result)
      const workbook = XLSX.read(filedatos, { type: 'array' })

      const sheetName = workbook.SheetNames[0]
      const sheetName2 = workbook.SheetNames[1]

      const sheet = workbook.Sheets[sheetName]
      const sheet2 = workbook.Sheets[sheetName2]

      const jsondatos = XLSX.utils.sheet_to_json(sheet)
      const jsondatos2 = XLSX.utils.sheet_to_json(sheet2)

      setDatos(jsondatos)
      setDatosInformacion(jsondatos2)
    }

    reader.readAsArrayBuffer(file)
  }

  const procesarDatos = (datos, datos2) => {
    sacarPorcentajes(datos)
    sacarRequerimientoMinimo(datos2)
  }

  const sacarPorcentajes = (datos) => {
    const nuevosDatos = datos.map((dato) => {
      const codigo = dato['No.']
      const sumaCrj = sumarValoresPorPrefijo(dato, 'crj')
      const sumaGenui = sumarValoresPorPrefijo(dato, 'genui')
      const sumaSas = sumarValoresPorPrefijo(dato, 'sas')
      const total = sumaCrj + sumaGenui + sumaSas
      const porcentajeCrj = (sumaCrj / total).toFixed(2)
      const porcentajeGenui = (sumaGenui / total).toFixed(2)
      const porcentajeSas = (sumaSas / total).toFixed(2)

      return {
        item: codigo,
        crj: sumaCrj,
        porcentajeCrj,
        genui: sumaGenui,
        porcentajeGenui,
        sas: sumaSas,
        porcentajeSas,
        total
      }
    })

    setDatosPorcentajes(nuevosDatos)
  }

  const sumarValoresPorPrefijo = (obj, prefijo) => {
    return Object.keys(obj)
      .filter(key => key.startsWith(prefijo))
      .reduce((total, key) => total + obj[key], 0)
  }

  const sacarRequerimientoMinimo = (obj) => {
    const nuevoObj = []

    for (const key in obj) {
      nuevoObj.push({
        item: obj[key]['No.'],
        cantidad: obj[key].Cantidad,
        reqMinCrj: obj[key]['Crj Min'] - obj[key]['Crj Stock'],
        reqMaxCrj: obj[key]['Crj Max'],
        reqMinGenui: obj[key]['Genui Min'] - obj[key]['Genui Stock'],
        reqMaxGenui: obj[key]['Genui Max'],
        reqMinSas: obj[key]['Sas Min'] - obj[key]['Sas Stock'],
        reqMaxSas: obj[key]['Sas Max']
      })
    }

    setDatosRequerimientos(nuevoObj)
  }

  const combinarArrays = (array1, array2) => {
    const datos = array1.map(obj1 => {
      const obj2 = array2.find(obj => obj.item === obj1.item)
      return obj2 ? { ...obj1, ...obj2 } : obj1
    })

    console.log(datos)
    return datos
  }

  const repartirPorcentajes = () => {
    const datos = combinarArrays(datosRequerimientos, datosPorcentajes)

    return datos.map(obj => {
      let cantidadCrj = (obj.cantidad * parseFloat(obj.porcentajeCrj)).toFixed(0)
      if (cantidadCrj > obj.reqMinCrj) {
        cantidadCrj = obj.reqMinCrj
      }

      let cantidadGenui = (obj.cantidad * parseFloat(obj.porcentajeGenui)).toFixed(0)
      if (cantidadGenui > obj.reqMinGenui) {
        cantidadGenui = obj.reqMinGenui
      }

      const cantidadRestante = obj.cantidad - (cantidadCrj + cantidadGenui)

      return {
        ...obj,
        cantidadCrj,
        cantidadGenui,
        cantidadSas: 0,
        cantidad: cantidadRestante
      }
    })
  }

  const repartirSobrantes = () => {
    const datos = repartirPorcentajes()

    return datos.map(obj => {
      let diferencia = obj.reqMaxGenui - obj.cantidadGenui

      if (diferencia > obj.Cantidad) {
        diferencia = 0
      }

      const cantidadGenui = obj.cantidadGenui + diferencia
      let cantidadSas = obj.cantidad - diferencia
      if (cantidadSas < 0) {
        cantidadSas = 0
      }

      return {
        ...obj,
        cantidadGenui,
        cantidadSas,
        cantidad: 0
      }
    })
  }

  // TODO: GENERAR EXCEL
  const generateExcel = () => {
    const distribuciones = repartirSobrantes()

    console.log(distribuciones)
    const wb = XLSX.utils.book_new()
    const datos = distribuciones.map((item) => [
      item.item,
      Number(item.cantidadCrj) + Number(item.cantidadGenui) + Number(item.cantidadSas),
      item.cantidadCrj,
      item.cantidadGenui,
      item.cantidadSas
    ])

    const headers = [
      'N° Item',
      'Cantidad Total',
      'CRJ',
      'GENUI',
      'SAS'
    ]

    const wsData = [headers, ...datos]
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    XLSX.utils.book_append_sheet(wb, ws, 'Reporte')

    const wsCols = headers.map((header, index) => ({
      wch: header.length + 20
    }))
    ws['!cols'] = wsCols

    XLSX.writeFile(wb, 'Distribuciones.xlsx')
  }

  return (
    <div>
      <input type='file' onChange={handleFileUpload} />
      <button onClick={generateExcel}>Descargar</button>
    </div>
  )
}

export default Distribucion
