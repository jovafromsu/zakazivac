// Static Swagger specification without dynamic file scanning
export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Zakazivač API',
    version: '1.0.0',
    description: 'Sistem za zakazivanje termina - kompletna API dokumentacija',
    contact: {
      name: 'API Support',
      email: 'support@zakazivac.rs'
    }
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://zakazivac.vercel.app' 
        : 'http://localhost:3000',
      description: process.env.NODE_ENV === 'production' 
        ? 'Production server' 
        : 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Jedinstveni ID korisnika' },
          email: { type: 'string', format: 'email', description: 'Email adresa' },
          name: { type: 'string', description: 'Ime korisnika' },
          role: { 
            type: 'string', 
            enum: ['client', 'provider'], 
            description: 'Uloga korisnika' 
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      ProviderProfile: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Jedinstveni ID profila' },
          userId: { type: 'string', description: 'ID korisnika' },
          businessName: { type: 'string', description: 'Naziv biznisa' },
          description: { type: 'string', description: 'Opis biznisa' },
          phone: { type: 'string', description: 'Telefon' },
          email: { type: 'string', format: 'email', description: 'Poslovna email adresa' },
          address: { type: 'string', description: 'Adresa' },
          city: { type: 'string', description: 'Grad' },
          timezone: { type: 'string', description: 'Vremenska zona', default: 'Europe/Belgrade' },
          isActive: { type: 'boolean', description: 'Status aktivnosti profila' },
          isFeatured: { type: 'boolean', description: 'Da li je profil istaknnut' },
          availabilitySettings: { 
            type: 'object',
            description: 'Podešavanja dostupnosti (Mixed MongoDB field)'
          },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Service: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Jedinstveni ID usluge' },
          providerId: { type: 'string', description: 'ID provider profila' },
          name: { type: 'string', description: 'Naziv usluge' },
          description: { type: 'string', description: 'Opis usluge' },
          duration: { type: 'number', description: 'Trajanje u minutima' },
          price: { type: 'number', description: 'Cena usluge' },
          currency: { type: 'string', default: 'RSD', description: 'Valuta' },
          isActive: { type: 'boolean', description: 'Status aktivnosti usluge' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Jedinstveni ID rezervacije' },
          clientId: { type: 'string', description: 'ID klijenta' },
          providerId: { type: 'string', description: 'ID provider profila' },
          serviceId: { type: 'string', description: 'ID usluge' },
          startTime: { type: 'string', format: 'date-time', description: 'Vreme početka' },
          endTime: { type: 'string', format: 'date-time', description: 'Vreme kraja' },
          status: { 
            type: 'string', 
            enum: ['pending', 'confirmed', 'cancelled', 'completed'], 
            description: 'Status rezervacije' 
          },
          notes: { type: 'string', description: 'Napomene' },
          googleEventId: { type: 'string', description: 'ID Google Calendar događaja' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      TimeSlot: {
        type: 'object',
        properties: {
          startTime: { type: 'string', format: 'date-time', description: 'Vreme početka slota' },
          endTime: { type: 'string', format: 'date-time', description: 'Vreme kraja slota' },
          isAvailable: { type: 'boolean', description: 'Da li je slot dostupan' }
        }
      },
      ApiError: {
        type: 'object',
        properties: {
          error: { type: 'string', description: 'Poruka o grešci' },
          code: { type: 'string', description: 'Kod greške' }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'Endpoints za autentifikaciju'
    },
    {
      name: 'Providers',
      description: 'Endpoints za pružaoce usluga'
    },
    {
      name: 'Services',
      description: 'Endpoints za usluge'
    },
    {
      name: 'Bookings',
      description: 'Endpoints za rezervacije'
    },
    {
      name: 'Availability',
      description: 'Endpoints za dostupnost'
    },
    {
      name: 'Integrations',
      description: 'Endpoints za integracije (Google Calendar)'
    }
  ],
  paths: {
    '/api/providers': {
      get: {
        tags: ['Providers'],
        summary: 'Lista aktivnih providera',
        description: 'Vraća listu svih aktivnih providera ili specifičan profil po userId',
        parameters: [
          {
            in: 'query',
            name: 'userId',
            schema: { type: 'string' },
            required: false,
            description: 'ID korisnika za dohvatanje specifičnog profila'
          }
        ],
        responses: {
          '200': {
            description: 'Lista providera uspešno dohvaćena',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    {
                      type: 'object',
                      properties: {
                        profile: { $ref: '#/components/schemas/ProviderProfile' }
                      }
                    },
                    {
                      type: 'object',
                      properties: {
                        providers: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/ProviderProfile' }
                        }
                      }
                    }
                  ]
                }
              }
            }
          },
          '500': {
            description: 'Server greška',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' }
              }
            }
          }
        }
      }
    },
    '/api/booking': {
      get: {
        tags: ['Bookings'],
        summary: 'Lista rezervacija korisnika',
        description: 'Vraća sve rezervacije trenutno ulogovanog korisnika',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista rezervacija uspešno dohvaćena',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    bookings: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Booking' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Bookings'],
        summary: 'Kreiranje nove rezervacije',
        description: 'Kreira novu rezervaciju za ulogovanog klijenta',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['providerId', 'serviceId', 'start'],
                properties: {
                  providerId: { type: 'string', example: '507f1f77bcf86cd799439011' },
                  serviceId: { type: 'string', example: '507f1f77bcf86cd799439012' },
                  start: { type: 'string', format: 'date-time', example: '2025-11-20T10:00:00.000Z' },
                  note: { type: 'string', example: 'Molim vas da me kontaktirate unapred' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Rezervacija uspešno kreirana',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    booking: { $ref: '#/components/schemas/Booking' },
                    message: { type: 'string', example: 'Booking created successfully' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/provider/profile': {
      get: {
        tags: ['Providers'],
        summary: 'Dohvata profil trenutno ulogovanog providera',
        description: 'Vraća kompletne podatke o provider profilu trenutno ulogovanog korisnika',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Provider profil uspešno dohvaćen',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ProviderProfile' }
              }
            }
          },
          '401': {
            description: 'Neautorizovani pristup',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' }
              }
            }
          },
          '404': {
            description: 'Provider profil nije pronađen',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ApiError' }
              }
            }
          }
        }
      },
      put: {
        tags: ['Providers'],
        summary: 'Ažurira ili kreira profil providera',
        description: 'Ažurira postojeći provider profil ili kreira novi ako ne postoji',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['businessName', 'timezone', 'isActive'],
                properties: {
                  businessName: {
                    type: 'string',
                    description: 'Naziv biznisa',
                    example: 'Frizerski salon Milica'
                  },
                  description: {
                    type: 'string',
                    description: 'Opis biznisa',
                    example: 'Profesionalna frizerska usluga sa 10 godina iskustva'
                  },
                  contactInfo: {
                    type: 'object',
                    properties: {
                      phone: { type: 'string', example: '+381601234567' },
                      email: { type: 'string', format: 'email', example: 'kontakt@salon-milica.rs' },
                      address: { type: 'string', example: 'Knez Mihailova 15, Beograd' }
                    }
                  },
                  timezone: {
                    type: 'string',
                    description: 'Vremenska zona',
                    example: 'Europe/Belgrade'
                  },
                  isActive: {
                    type: 'boolean',
                    description: 'Status aktivnosti profila',
                    example: true
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Profil uspešno ažuriran',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Profile updated successfully' },
                    profile: { $ref: '#/components/schemas/ProviderProfile' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/services': {
      get: {
        tags: ['Services'],
        summary: 'Lista usluga providera',
        description: 'Vraća sve usluge trenutno ulogovanog providera',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Lista usluga uspešno dohvaćena',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    services: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Service' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/slots': {
      get: {
        tags: ['Availability'],
        summary: 'Dostupni termini za rezervaciju',
        description: 'Vraća listu dostupnih termina za specifičan provider, servis i datum',
        parameters: [
          {
            in: 'query',
            name: 'providerId',
            required: true,
            schema: { type: 'string' },
            description: 'ID providera',
            example: '507f1f77bcf86cd799439011'
          },
          {
            in: 'query',
            name: 'serviceId',
            required: true,
            schema: { type: 'string' },
            description: 'ID usluge',
            example: '507f1f77bcf86cd799439012'
          },
          {
            in: 'query',
            name: 'date',
            required: true,
            schema: { type: 'string', format: 'date' },
            description: 'Datum za koji se traže termini (YYYY-MM-DD)',
            example: '2025-11-20'
          }
        ],
        responses: {
          '200': {
            description: 'Lista dostupnih termina',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    slots: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/TimeSlot' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/providers/featured': {
      get: {
        tags: ['Providers'],
        summary: 'Istaknuti provideri',
        description: 'Vraća listu istaknutih providera sortiranih po rejtingu (maksimalno 6)',
        responses: {
          '200': {
            description: 'Lista istaknutih providera uspešno dohvaćena',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    providers: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          _id: { type: 'string' },
                          businessName: { type: 'string' },
                          description: { type: 'string' },
                          contactInfo: { type: 'object' },
                          services: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                name: { type: 'string' },
                                price: { type: 'number' },
                                duration: { type: 'number' }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};