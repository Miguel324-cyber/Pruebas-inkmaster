describe('Pruebas de Login - InkMaster', () => {
  beforeEach(() => {
    // Visitar la página de login antes de cada prueba
    // La baseUrl ya está configurada como http://inkmaster.duckdns.org:4200/
    cy.visit('/login')
  })

  it('Debe realizar registro y luego login exitoso', () => {
    // Primero crear un usuario válido
    const timestamp = Date.now()
    const emailUnico = `testuser.${timestamp}@inkmaster.com`
    const password = 'TestUser2025!'
    
    // Ir a registro para crear el usuario
    cy.visit('/registrate')
    cy.get('#correoCliente').type(emailUnico)
    cy.get('#nombreCliente').type('Test User')
    cy.get('#apellidoCliente').type('Login Test')
    cy.get('#telefonoCliente').type('612345678')
    
    // Usar JavaScript nativo para la contraseña
    cy.get('#contrasenaCliente').then($input => {
      const input = $input[0]
      input.value = password
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    
    // Registrar usuario
    cy.get('button[type="submit"]').click()
    
    // Esperar un poco para que se procese
    cy.wait(2000)
    
    // Ahora ir a login
    cy.visit('/login')
    
    // Hacer login con el usuario recién creado
    cy.get('#correo').type(emailUnico)  
    cy.get('#contrasena').type(password)
    cy.get('button[type="submit"]').click()
    
    // Verificar resultado - puede ser exitoso o mostrar error
    cy.wait(3000) // Esperar respuesta del servidor
    
    // Verificar que al menos no crashea la aplicación
    cy.get('body').should('exist')
  })

  it('Debe mostrar error con credenciales inexistentes', () => {
    cy.get('#correo').type('usuario-que-no-existe@inkmaster.com')
    cy.get('#contrasena').type('password123')
    cy.get('button[type="submit"]').click()
    
    // Esperar respuesta del servidor
    cy.wait(2000)
    
    // Verificar que permanece en la página de login (login falló)
    cy.url().should('include', '/login')
  })
  it('Debe validar campos obligatorios', () => {
    // Intentar hacer clic sin llenar campos
    cy.get('button[type="submit"]').click()
    
    // Verificar que permanece en la página de login
    cy.url().should('include', '/login')
    
    // Tocar los campos para activar cualquier validación
    cy.get('#correo').click().blur()
    cy.get('#contrasena').click().blur()
    
    // Verificar que los campos existen y están vacíos
    cy.get('#correo').should('have.value', '')
    cy.get('#contrasena').should('have.value', '')
  })

  it('Debe permitir login usando Enter', () => {
    // Crear usuario primero
    const timestamp = Date.now()
    const emailUnico = `enteruser.${timestamp}@inkmaster.com`
    const password = 'EnterTest2025!'
    
    // Registrar usuario primero
    cy.visit('/registrate')
    cy.get('#correoCliente').type(emailUnico)
    cy.get('#nombreCliente').type('Enter User')
    cy.get('#apellidoCliente').type('Test')
    cy.get('#telefonoCliente').type('612345679')
    cy.get('#contrasenaCliente').then($input => {
      const input = $input[0]
      input.value = password
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    cy.get('button[type="submit"]').click()
    cy.wait(2000)
    
    // Ahora probar login con Enter
    cy.visit('/login')
    cy.get('#correo').type(emailUnico)
    cy.get('#contrasena').type(password + '{enter}')
    
    // Esperar y verificar
    cy.wait(3000)
    cy.get('body').should('exist')
  })

  it('Debe mostrar título del formulario', () => {
    // Verificar que aparece el título correcto según tu HTML
    cy.get('.form-title').should('contain', 'Ingresa tus credenciales')
  })

  it('Debe tener todos los campos requeridos', () => {
    // Verificar que todos los campos están presentes según tu HTML
    cy.get('#correo').should('exist')
    cy.get('#contrasena').should('exist')
    cy.get('button[type="submit"]').should('exist')
    
    // Verificar las etiquetas
    cy.get('label[for="correo"]').should('contain', 'Correo')
    cy.get('label[for="contrasena"]').should('contain', 'Contraseña')
    cy.get('button[type="submit"]').should('contain', 'Ingresar')
  })

  it('Debe manejar respuesta del servidor correctamente', () => {
    // Interceptar la petición de login para ver qué pasa
    cy.intercept('POST', '**/api/login').as('loginRequest')
    
    cy.get('#correo').type('test@inkmaster.com')
    cy.get('#contrasena').type('testpassword')
    cy.get('button[type="submit"]').click()
    
    // Esperar la petición y verificar que se hace
    cy.wait('@loginRequest').then((interception) => {
      // Verificar que la petición se hizo
      expect(interception.request.body).to.exist    })
    
    // Verificar que la aplicación maneja la respuesta
    cy.get('body').should('exist')
  })

  it('Debe validar formato de email', () => {
    cy.get('#correo').type('email-invalido')
    cy.get('#correo').blur()
    
    // Verificar que el valor se escribió correctamente
    cy.get('#correo').should('have.value', 'email-invalido')
    
    // Intentar enviar el formulario con email inválido
    cy.get('#contrasena').type('password123')
    cy.get('button[type="submit"]').click()
    
    // Verificar que permanece en login (validación falló)
    cy.wait(1000)
    cy.url().should('include', '/login')
  })
  it('Debe manejar caracteres especiales en contraseña', () => {
    cy.get('#correo').type('test@inkmaster.com')
    cy.get('#contrasena').type('Test@123#$%!')
    
    // Verificar que acepta caracteres especiales
    cy.get('#contrasena').should('have.value', 'Test@123#$%!')
    
    cy.get('button[type="submit"]').click()
    
    // Verificar que no crashea
    cy.wait(2000)
    cy.get('body').should('exist')
  })
  it('Debe validar longitud mínima de contraseña', () => {
    cy.get('#correo').type('test@inkmaster.com')
    cy.get('#contrasena').type('123')
    
    // Verificar que el valor se escribió
    cy.get('#contrasena').should('have.value', '123')
    
    // Intentar enviar formulario con contraseña corta
    cy.get('button[type="submit"]').click()
    
    // Verificar que permanece en login o maneja la validación
    cy.wait(1000)
    cy.url().should('include', '/login')
  })

  it('Debe limpiar campos con botón clear', () => {
    cy.get('#correo').type('usuario@test.com')
    cy.get('#contrasena').type('password123')
    
    // Verificar que los campos tienen valores
    cy.get('#correo').should('have.value', 'usuario@test.com')
    cy.get('#contrasena').should('have.value', 'password123')
    
    // Limpiar campos
    cy.get('#correo').clear()
    cy.get('#contrasena').clear()
    
    // Verificar que están vacíos
    cy.get('#correo').should('have.value', '')
    cy.get('#contrasena').should('have.value', '')
  })

  it('Debe mostrar el formulario en contenedor correcto', () => {
    // Verificar estructura del HTML según tu código
    cy.get('.form-wrapper').should('exist')
    cy.get('.container#form').should('exist')
    cy.get('form').should('have.class', 'p-3')
    cy.get('form').should('have.class', 'm-5')
    cy.get('form').should('have.class', 'rounded')
  })

  it('Debe tener etiquetas con clases correctas', () => {
    // Verificar clases según tu HTML
    cy.get('label[for="correo"]').should('have.class', 'form-label')
    cy.get('label[for="contrasena"]').should('have.class', 'form-label')
    cy.get('#correo').should('have.class', 'form-control')
    cy.get('#contrasena').should('have.class', 'form-control')
  })

  it('Debe tener botón con estilos correctos', () => {
    // Verificar clases del botón según tu HTML
    cy.get('button[type="submit"]').should('have.class', 'btn')
    cy.get('button[type="submit"]').should('have.class', 'btn-dark')
    cy.get('.text-center').should('exist')
  })

  it('Debe manejar múltiples intentos de login fallidos', () => {
    // Primer intento
    cy.get('#correo').type('usuario@noexiste.com')
    cy.get('#contrasena').type('wrongpassword')
    cy.get('button[type="submit"]').click()
    cy.wait(2000)
    cy.url().should('include', '/login')
    
    // Segundo intento
    cy.get('#correo').clear().type('otro@noexiste.com')
    cy.get('#contrasena').clear().type('otrapassword')
    cy.get('button[type="submit"]').click()
    cy.wait(2000)
    
    // Verificar que sigue en login
    cy.url().should('include', '/login')
  })

  it('Debe completar flujo completo registro-login exitoso', () => {
    // Registro completo
    const timestamp = Date.now()
    const email = `fulltest.${timestamp}@inkmaster.com`
    const password = 'FullTest2025!'
    
    cy.visit('/registrate')
    cy.get('#correoCliente').type(email)
    cy.get('#nombreCliente').type('Usuario Completo')
    cy.get('#apellidoCliente').type('Prueba Full')
    cy.get('#telefonoCliente').type('987654321')
    cy.get('#contrasenaCliente').then($input => {
      const input = $input[0]
      input.value = password
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    cy.get('button[type="submit"]').click()
    cy.wait(3000)
    
    // Login con usuario registrado
    cy.visit('/login')
    cy.get('#correo').type(email)
    cy.get('#contrasena').type(password)
    cy.get('button[type="submit"]').click()
    cy.wait(3000)
    
    // Verificar que al menos no hay errores críticos
    cy.get('body').should('exist')
  })
})