const { spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const fse = require('fs-extra')

const runningProcesses = []

const createContainer = (req, res) => {
  try {
    if (!req.files || req.files.length < 1) {
      throw new Error('Please upload at least one file')
    }

    const containerId = uuidv4()
    const containerFolderPath = path.join(
      __dirname,
      '..',
      'containers',
      containerId,
    )

    if (fs.existsSync(containerFolderPath)) {
      throw new Error('A folder with that name already exists')
    }

    fs.mkdirSync(containerFolderPath)

    const indexFile = req.files.find((file) => file.originalname === 'index.js')
    if (!indexFile) {
      throw new Error('Please upload the required "index.js" file')
    }

    const indexPath = path.join(containerFolderPath, 'index.js')
    fs.writeFileSync(indexPath, indexFile.buffer)

    req.files.forEach((file) => {
      if (file.originalname !== 'index.js') {
        const filePath = path.join(containerFolderPath, file.originalname)
        fs.writeFileSync(filePath, file.buffer)
      }
    })

    res.status(200).json({ containerId })
  } catch (error) {
    console.error(`Error creating container: ${error.message}`)
    res
      .status(500)
      .json({ error: 'An error occurred while creating the container' })
  }
}

const startContainer = (req, res) => {
  const containerDirName = req.query.name

  if (!containerDirName) {
    return res.status(400).json({
      error: 'Container name is not specified in the request parameters.',
    })
  }

  const filePath = path.join(
    __dirname,
    '..',
    'containers',
    containerDirName,
    'index.js',
  )

  const logFilePath = path.join(
    __dirname,
    '..',
    'containers',
    containerDirName,
    'log.txt',
  )

  const logStream = fs.createWriteStream(logFilePath, { flags: 'a' })

  const childProcess = spawn('node', [filePath])

  const childProcessId = childProcess.pid

  childProcess.stdout.on('data', (data) => {
    const output = data.toString()
    console.log(`Output of the subprocess: ${output}`)
    logStream.write(`Output of the subprocess: ${output}\n`)
  })

  childProcess.stderr.on('data', (data) => {
    const error = data.toString()

    let indexToDelete = runningProcesses.findIndex(
      (process) => process.pid === childProcess.pid,
    )

    if (indexToDelete !== -1) {
      runningProcesses.splice(indexToDelete, 1)
    }

    console.error(`Subprocess error: ${error}`)
    logStream.write(`Subprocess error: ${error}\n`)
  })

  childProcess.on('close', (code) => {
    let indexToDelete = runningProcesses.findIndex(
      (process) => process.pid === childProcess.pid,
    )

    if (indexToDelete !== -1) {
      runningProcesses.splice(indexToDelete, 1)
    }
    console.log(`The subprocess ended with code ${code}`)
    logStream.write(`The subprocess ended with code ${code}\n`)
    logStream.end()
  })

  const containerInfo = {
    name: containerDirName,
    pid: childProcess.pid,
  }
  runningProcesses.push(containerInfo)

  res.status(200).json({ pid: childProcessId })
}

const stopContainer = (req, res) => {
  const pid = req.query.pid

  if (!pid) {
    return res
      .status(400)
      .json({ error: 'PID is not specified in the request parameters.' })
  }

  const killProcess = spawn('kill', ['-SIGTERM', pid])

  killProcess.on('close', (code) => {
    if (code === 0) {
      console.log(`Process with PID ${pid} was successfully stopped`)
      return res
        .status(200)
        .json({ message: `Process with PID ${pid} was successfully stopped` })
    } else {
      console.error(`Error stopping process with PID ${pid}: Exit code ${code}`)
      return res
        .status(500)
        .json({ error: `Error stopping process with PID ${pid}` })
    }
  })
}

const getContainerInfo = (req, res) => {
  res.status(200).json({ runningProcesses })
}

const getAllContainer = (req, res) => {
  const containersPath = path.join(__dirname, '..', 'containers')

  fs.readdir(containersPath, (err, files) => {
    if (err) {
      console.error(
        `An error occurred while reading the directory: ${err.message}`,
      )
      return res.status(500).json({ error: 'Error retrieving container list' })
    }

    const directories = files.filter((file) =>
      fs.statSync(path.join(containersPath, file)).isDirectory(),
    )

    res.status(200).json({ containers: directories })
  })
}

const getContainerStatus = (req, res) => {}

const getContainerLog = (req, res) => {
  try {
    const containerName = req.query.name

    if (!containerName) {
      throw new Error(
        'Please specify the name of the container to receive the log',
      )
    }

    const logFilePath = path.join(
      __dirname,
      '..',
      'containers',
      containerName,
      'log.txt',
    )

    if (!fs.existsSync(logFilePath)) {
      throw new Error(
        'The log.txt file for the specified container does not exist',
      )
    }

    const logContent = fs.readFileSync(logFilePath, 'utf8')

    res.status(200).json({ logContent })
  } catch (error) {
    console.error(`Error getting container log: ${error.message}`)
    res.status(500).json({ error: 'Error getting container log' })
  }
}

const deleteContainer = (req, res) => {
  try {
    const containerName = req.query.name

    if (!containerName) {
      throw new Error('Please specify the name of the container for removal.')
    }

    const containerPath = path.join(
      __dirname,
      '..',
      'containers',
      containerName,
    )

    if (!fs.existsSync(containerPath)) {
      throw new Error('The folder with the specified name does not exist.')
    }

    fse.removeSync(containerPath)

    res.status(200).json({
      message: `The folder ${containerName} and its contents have been deleted.`,
    })
  } catch (error) {
    console.error(`Error when deleting the container: ${error.message}`)
    res.status(500).json({ error: 'Error when deleting the container' })
  }
}

module.exports = {
  createContainer,
  startContainer,
  stopContainer,
  getContainerInfo,
  getContainerStatus,
  getContainerLog,
  deleteContainer,
  getAllContainer,
}
