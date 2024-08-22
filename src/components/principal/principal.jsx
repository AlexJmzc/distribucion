/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react'
import './principal.css'
import * as XLSX from 'xlsx'

const Principal = () => {
  const [datos, setDatos] = useState([])
  const [datosDistribucion, setDatosDistribucion] = useState([])
  const [, setDatosSeparados] = useState([])
  const [nuevosDatos, setNuevosDatos] = useState([])

  useEffect(() => {
    if (datos.length > 0) {
      procesarDatos(datos)
    }
  }, [datos])

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    const reader = new FileReader()

    reader.onload = (e) => {
      const filedatos = new Uint8Array(e.target.result)
      const workbook = XLSX.read(filedatos, { type: 'array' })

      const sheetName1 = workbook.SheetNames[0]
      const sheetName2 = workbook.SheetNames[1]
      const sheet1 = workbook.Sheets[sheetName1]
      const sheet2 = workbook.Sheets[sheetName2]

      const jsondatos = XLSX.utils.sheet_to_json(sheet1)
      const jsondatosDistribucion = XLSX.utils.sheet_to_json(sheet2)
      setDatos(jsondatos)
      setDatosDistribucion(jsondatosDistribucion)
    }

    reader.readAsArrayBuffer(file)
  }

  const procesarDatos = (datos) => {
    separarPorPallet(datos)
  }

  const separarPorPallet = (data) => {
    const result = {}

    data.forEach((obj) => {
      const pallet = obj['N° Pallet']

      if (!result[pallet]) {
        result[pallet] = []
      }
      result[pallet].push({
        ...obj,
        NORTE: 0,
        PRINCIPAL: 0,
        ATAHUALPA: 0,
        CARAPUNGO: 0,
        CRJ: 0,
        SAS: 0
      })
    })

    setDatosSeparados(result)
    combinarDatos(result)
  }

  //! COMBINAR EN UN SOLO ARRAY
  const combinarDatos = (datos) => {
    const dat = Object.values(datos).flat()

    setNuevosDatos(dat)
  }

  //! DISTRIBUIR
  function distribuirCantidad (requerimientos, disponibilidades) {
    let requ = requerimientos
    disponibilidades.forEach((disponibilidad) => {
      const item = disponibilidad['N° Item']
      let cantidadRestante = disponibilidad.Cantidad

      const ubicaciones = obtenerDistribucion(item, requerimientos)

      const ub = Object.entries(ubicaciones).sort(([, a], [, b]) => b - a)
      for (const req of ub) {
        if (cantidadRestante >= req[1]) {
          if (req[0] !== 'SAS') {
            disponibilidad[req[0]] = req[1]
            cantidadRestante -= req[1]
            requ = actualizarRequerimiento(item, req[0], requ, 0)
          } else {
            disponibilidad[req[0]] = cantidadRestante
          }
        } else {
          disponibilidad[req[0]] = 0
        }
      }
    })

    return disponibilidades
  }

  const obtenerDistribucion = (item, requerimientos) => {
    const req = { ...requerimientos.find(requerimiento => requerimiento['No. Item'] === item) }

    if (req) {
      delete req['No. Item']
      delete req.TOTAL
      return req
    }
  }

  const actualizarRequerimiento = (item, ubicacion, requerimientos, valor) => {
    const r = requerimientos.find(requerimiento => requerimiento['No. Item'] === item)

    r[ubicacion] = valor

    return requerimientos
  }

  // TODO: GENERAR EXCEL
  const generateExcel = () => {
    const distribuciones = distribuirCantidad(datosDistribucion, nuevosDatos)

    console.log(distribuciones)
    const wb = XLSX.utils.book_new()
    const datos = distribuciones.map((item) => [
      item['N° Item'],
      item['N° Pallet'],
      item.Cantidad,
      item.NORTE,
      item.PRINCIPAL,
      item.ATAHUALPA,
      item.CARAPUNGO,
      item.CRJ,
      item.SAS
    ])

    const headers = [
      'N° Item',
      'N° Pallet',
      'Cantidad',
      'NORTE',
      'PRINCIPAL',
      'ATAHUALPA',
      'CARAPUNGO',
      'CRJ',
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
    <div className='main'>
      <input type='file' accept='.xlsx, .xls' onChange={handleFileUpload} />
      <button onClick={generateExcel}>Descargar Excel</button>
    </div>
  )
}

export default Principal
