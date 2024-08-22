/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react'
import * as XLSX from 'xlsx'

import './distribucion.css'

const Distribucion = () => {
  const [datos, setDatos] = useState([])
  const [datosInformacion, setDatosInformacion] = useState([])
  const [datosPorcentajes, setDatosPorcentajes] = useState([])

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

      const sheetName = workbook.SheetNames[0]
      const sheetName2 = workbook.SheetNames[1]

      const sheet = workbook.Sheets[sheetName]
      const sheet2 = workbook.Sheets[sheetName2]

      const jsondatos = XLSX.utils.sheet_to_json(sheet)
      const jsondatos2 = XLSX.utils.sheet_to_json(sheet2)

      setDatos(jsondatos)
      console.log(jsondatos)
      setDatosInformacion(jsondatos2)
    }

    reader.readAsArrayBuffer(file)
  }

  const procesarDatos = (datos) => {
    sacarPorcentajes(datos)
  }

  const sacarPorcentajes = (datos) => {
    const nuevoArray = datos.map((dato) => {
      const codigo = dato.Código
      const sumaCrj = sumarValoresPorPrefijo(dato, 'crj')
      const sumaGenui = sumarValoresPorPrefijo(dato, 'genui')
      const sumaSas = sumarValoresPorPrefijo(dato, 'sas')
      const total = sumaCrj + sumaGenui + sumaSas
      const porcentajeCrj = (sumaCrj / total).toFixed(2)
      const porcentajeGenui = (sumaGenui / total).toFixed(2)
      const porcentajeSas = (sumaSas / total).toFixed(2)

      return {
        Codigo: codigo,
        crj: sumaCrj,
        porcentajeCrj,
        genui: sumaGenui,
        porcentajeGenui,
        sas: sumaSas,
        porcentajeSas,
        total
      }
    })

    console.log(nuevoArray)
  }
  function sumarValoresPorPrefijo (obj, prefijo) {
    return Object.keys(obj)
      .filter(key => key.startsWith(prefijo))
      .reduce((total, key) => total + obj[key], 0)
  }

  // TODO: GENERAR EXCEL
  //   const generateExcel = () => {
  //     const distribuciones = distribuirCantidad(datosDistribucion, nuevosDatos)

  //     console.log(distribuciones)
  //     const wb = XLSX.utils.book_new()
  //     const datos = distribuciones.map((item) => [
  //       item['N° Item'],
  //       item['N° Pallet'],
  //       item.Cantidad,
  //       item.NORTE,
  //       item.PRINCIPAL,
  //       item.ATAHUALPA,
  //       item.CARAPUNGO,
  //       item.CRJ,
  //       item.SAS
  //     ])

  //     const headers = [
  //       'N° Item',
  //       'N° Pallet',
  //       'Cantidad',
  //       'NORTE',
  //       'PRINCIPAL',
  //       'ATAHUALPA',
  //       'CARAPUNGO',
  //       'CRJ',
  //       'SAS'
  //     ]

  //     const wsData = [headers, ...datos]
  //     const ws = XLSX.utils.aoa_to_sheet(wsData)

  //     XLSX.utils.book_append_sheet(wb, ws, 'Reporte')

  //     const wsCols = headers.map((header, index) => ({
  //       wch: header.length + 20
  //     }))
  //     ws['!cols'] = wsCols

  //     XLSX.writeFile(wb, 'Distribuciones.xlsx')
  //   }

  return (
    <div>
      <input type='file' onChange={handleFileUpload} />
      {/* <button onClick={generateExcel}>Descargar</button> */}
    </div>
  )
}

export default Distribucion
