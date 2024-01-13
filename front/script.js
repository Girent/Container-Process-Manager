document.addEventListener('DOMContentLoaded', function () {
  const BASE_URL = 'http://localhost:3000'

  fetchContainers()
  fetchRunningContainers()

  function fetchContainers() {
    fetch(`${BASE_URL}/container/`)
      .then((response) => response.json())
      .then((data) => {
        displayContainers(data.containers)
      })
      .catch((error) => console.error('Error fetch data:', error))
  }

  function fetchRunningContainers() {
    fetch(`${BASE_URL}/container/info`)
      .then((response) => response.json())
      .then((data) => {
        displayRunningContainers(data.runningProcesses)
      })
      .catch((error) =>
        console.error('Error getting running containers:', error),
      )
  }

  function displayContainers(containers) {
    const containerList = document.getElementById('containerList')
    containerList.innerHTML = ''
    containers.forEach((container) => {
      const containerItem = document.createElement('li')
      containerItem.className = 'containerItem'
      containerItem.innerHTML = `
              <div>${container}</div>
              <button type="button" class="toggleButton">Run</button>
              <button type="button" class="deleteButton">Delete</button>
          `
      containerList.appendChild(containerItem)
    })

    const toggleButtons = document.querySelectorAll('.toggleButton')
    toggleButtons.forEach((button) => {
      button.addEventListener('click', toggleContainer)
    })

    const deleteButtons = document.querySelectorAll('.deleteButton')
    deleteButtons.forEach((button) => {
      button.addEventListener('click', deleteContainer)
    })

    updateRunningContainersButtons()
  }

  function displayRunningContainers(runningProcesses) {
    const runningContainerList = document.getElementById('runningContainerList')
    runningContainerList.innerHTML = ''

    runningProcesses.forEach((process) => {
      const containerItem = document.createElement('li')
      containerItem.className = 'containerItem'
      containerItem.innerHTML = `
              <div>${process.name}</div>
              <div>PID: ${process.pid}</div>
              <button type="button" class="logButton">log</button>
              <div class="logContent" style="display:none;"></div>
          `
      runningContainerList.appendChild(containerItem)
    })

    const logButtons = document.querySelectorAll('.logButton')
    logButtons.forEach((button) => {
      button.addEventListener('click', toggleLogContent)
    })

    updateRunningContainersButtons()
  }

  function updateRunningContainersButtons() {
    const toggleButtons = document.querySelectorAll('.toggleButton')
    toggleButtons.forEach((button) => {
      const containerName =
        button.parentElement.querySelector('div').textContent
      const isRunning = isContainerRunning(containerName)

      if (isRunning) {
        button.textContent = 'Stop'
        button.style.backgroundColor = 'red'
        button.style.color = 'white'
      } else {
        button.textContent = 'Start'
        button.style.backgroundColor = 'green'
        button.style.color = 'white'
      }
    })
  }

  function isContainerRunning(containerName) {
    const runningContainerList = document.getElementById('runningContainerList')
    const runningContainers = runningContainerList.querySelectorAll('div')

    for (const container of runningContainers) {
      if (container.textContent === containerName) {
        return true
      }
    }

    return false
  }

  function createContainer() {
    const fileInput = document.getElementById('fileInput')
    const files = fileInput.files

    if (files.length > 0) {
      const formData = new FormData()

      for (const file of files) {
        formData.append('files', file)
      }

      fetch(`${BASE_URL}/container/create`, {
        method: 'POST',
        body: formData,
      })
        .then((response) => response.json())
        .then((data) => {
          console.log('Container has been created:', data.containerIds)
          fetchContainers()
          closeModal()
        })
        .catch((error) => console.error('Failed to create container:', error))
    } else {
      console.error('Select the files to create the container.')
    }
  }

  function openModal() {
    const modal = document.getElementById('modal')
    const modalOverlay = document.getElementById('modal-overlay')

    modal.style.display = 'block'
    modalOverlay.style.display = 'block'

    const createContainerButton = document.getElementById(
      'createContainerButton',
    )
    createContainerButton.addEventListener('click', function () {
      createContainer()
    })

    const closeModalButton = document.getElementById('closeModalButton')
    closeModalButton.addEventListener('click', closeModal)
  }

  function closeModal() {
    const modal = document.getElementById('modal')
    const modalOverlay = document.getElementById('modal-overlay')

    modal.style.display = 'none'
    modalOverlay.style.display = 'none'

    const fileInput = document.getElementById('fileInput')
    fileInput.value = ''
  }

  function toggleContainer() {
    const containerName = this.parentElement.querySelector('div').textContent
    const buttonText = this.textContent

    if (buttonText === 'Start') {
      startContainer(containerName)
    } else if (buttonText === 'Stop') {
      stopContainer(containerName)
    }
  }

  function startContainer(containerName) {
    console.log('Starting the container:', containerName)

    fetch(`${BASE_URL}/container/start?name=${containerName}`, {
      method: 'POST',
    })
      .then((response) => {
        if (response.ok) {
          console.log('Container started successfully.')
          fetchContainers()
          fetchRunningContainers()
        } else {
          console.error('Failed to launch the container:', response.statusText)
        }
      })
      .catch((error) => console.error('Failed to launch the container:', error))
  }

  function stopContainer(containerName) {
    const runningContainerList = document.getElementById('runningContainerList')
    const runningContainers = runningContainerList.querySelectorAll('div')

    let pid = null
    for (const container of runningContainers) {
      if (container.textContent === containerName) {
        pid = container.nextElementSibling.textContent.split(': ')[1]
        break
      }
    }

    if (pid) {
      console.log('Container stop:', containerName)

      fetch(`${BASE_URL}/container/stop?pid=${pid}`, {
        method: 'POST',
      })
        .then((response) => {
          if (response.ok) {
            console.log('Container stopped successfully.')
            fetchContainers()
            fetchRunningContainers()
          } else {
            console.error('Container stop error:', response.statusText)
          }
        })
        .catch((error) => console.error('Container stop error:', error))
    } else {
      console.error('Container PID not found.')
    }
  }

  function deleteContainer() {
    const containerName = this.parentElement.querySelector('div').textContent
    console.log('Removing a container:', containerName)

    fetch(`${BASE_URL}/container/delete?name=${containerName}`, {
      method: 'DELETE',
    })
      .then((response) => {
        if (response.ok) {
          console.log('Container removed successfully.')
          fetchContainers()
          fetchRunningContainers()
        } else {
          console.error('Error removing container:', response.statusText)
        }
      })
      .catch((error) => console.error('Error removing container:', error))
  }

  function toggleLogContent() {
    const logContent = this.parentElement.querySelector('.logContent')
    const containerName = this.parentElement.querySelector('div').textContent

    if (logContent.style.display === 'none') {
      fetchLogContent(containerName, logContent)
    } else {
      logContent.style.display = 'none'
    }
  }

  function fetchLogContent(containerName, logContentElement) {
    fetch(`${BASE_URL}/container/log?name=${containerName}`)
      .then((response) => response.json())
      .then((data) => {
        logContentElement.textContent = data.logContent
        logContentElement.style.display = 'block'
      })
      .catch((error) => {
        console.error('Error getting container log:', error)
        logContentElement.style.display = 'none'
      })
  }

  const refreshContainerListButton = document.getElementById(
    'refreshContainerListButton',
  )
  refreshContainerListButton.addEventListener('click', fetchContainers)

  const refreshRunningContainersButton = document.getElementById(
    'refreshRunningContainersButton',
  )
  refreshRunningContainersButton.addEventListener(
    'click',
    fetchRunningContainers,
  )

  const addContainerButton = document.getElementById('addContainerButton')
  addContainerButton.addEventListener('click', openModal)
})
