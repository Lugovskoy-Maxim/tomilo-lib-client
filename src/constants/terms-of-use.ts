const lastUpdateDate = "05.03.2026";

const termsOfUse = {
  ru: {
    title: "Пользовательское соглашение",
    description:
      "Пожалуйста, внимательно ознакомьтесь с настоящим Соглашением до начала использования сайта tomilo-lib.ru",
    lastUpdated: `Последнее обновление: ${lastUpdateDate}`,
    languageButton: "English",

    // Основные разделы
    sections: {
      general: {
        title: "Общие положения",
        content:
          "Независимо от наличия регистрации, посещая Сайт и используя его сервисы, вы обязуетесь соблюдать условия настоящего Соглашения и Правил. Весь контент, размещенный на Сайте, получен из публичных и открытых источников. Если вы не согласны с этими условиями, вы обязаны прекратить использование Сайта и его функционала.",
      },
      definitions: {
        title: "Термины и определения",
        items: [
          "Посетитель - лицо, получающее доступ к информации, размещенной в доменной зоне tomilo-lib.ru",
          "Пользователь - Посетитель Сайта, зарегистрировавший учетную запись в установленном порядке",
          "Сайт - информационный ресурс tomilo-lib.ru, включая связанные программы для ЭВМ и базы данных, обеспечивающие его работу",
          "Контент - материалы, размещенные на Сайте Администрацией и/или правообладателями в соответствии с применимыми правами",
          "Комментарий - текстовое сообщение Пользователя, размещаемое в предусмотренных разделах Сайта",
          "Имя пользователя (ник) - отображаемое имя Пользователя в рамках Учетной записи на Сайте",
          "Аватар - изображение, загружаемое Пользователем для отображения в профиле и при публикации комментариев",
          "Учетная запись - аутентификационные и личные данные Пользователя, хранимые на серверах Сайта",
          "Регистрация - действия Посетителя по созданию Учетной записи на Сайте",
          "Администрация - уполномоченные лица, определяющие порядок использования Сайта",
        ],
      },
      agreement: {
        title: "Предмет соглашения",
        items: [
          "Настоящее Соглашение определяет порядок и условия использования Сайта",
          "Соглашение является публичной офертой в соответствии с законодательством Российской Федерации",
          "Факт регистрации и/или продолжения использования Сайта означает полное и безусловное согласие Пользователя с условиями Соглашения",
          "Администрация вправе вносить изменения в Соглашение в одностороннем порядке",
          "Пользователь несет персональную ответственность за публикуемые комментарии и последствия их размещения",
        ],
      },
      userContentRequirements: {
        title:
          "Требования к имени пользователя, аватару и комментариям (соответствие законодательству РФ)",
        intro:
          "В целях соблюдения законодательства Российской Федерации (в том числе Федерального закона от 29.12.2010 № 436-ФЗ «О защите детей от информации, причиняющей вред их здоровью и развитию», Федерального закона от 27.07.2006 № 149-ФЗ «Об информации, информационных технологиях и о защите информации», КоАП РФ, УК РФ) Пользователь обязуется соблюдать следующие требования:",
        nickname: {
          title: "Имя пользователя (ник)",
          items: [
            "Не должно содержать ненормативную лексику, оскорбительные, унижающие достоинство или призывы к насилию",
            "Не должно содержать символику или атрибутику экстремистских организаций, призывы к экстремизму или терроризму",
            "Не должно создавать впечатление, что Пользователь действует от имени других лиц, организаций или органов власти, если на то нет правовых оснований",
            "Не должно пропагандировать употребление наркотиков, алкоголя, суицид или иной вред здоровью",
            "Не должно содержать дискриминацию по признакам расы, национальности, религии, пола и иным признакам, запрещенным законом",
            "Администрация вправе отказать в регистрации, потребовать смены имени или заблокировать учетную запись при нарушении указанных требований",
          ],
        },
        avatar: {
          title: "Аватар",
          items: [
            "Не должен содержать порнографию, сцены насилия, жестокости, изображения, причиняющие вред здоровью и развитию детей",
            "Не должен содержать символику или атрибутику экстремистских организаций, нацистскую символику, призывы к экстремизму или терроризму",
            "Не должен нарушать права третьих лиц (в том числе право на изображение гражданина)",
            "Не должен пропагандировать употребление наркотиков, алкоголя, суицид или иной вред",
            "Должен соответствовать нормам законодательства РФ об информации и защите несовершеннолетних",
            "Администрация вправе удалить аватар и/или ограничить доступ Пользователя при нарушении указанных требований",
          ],
        },
        comments: {
          title: "Комментарии",
          items: [
            "Запрещается размещение комментариев экстремистского характера, призывов к насилию, терроризму, разжиганию межнациональной, межрелигиозной или иной розни",
            "Запрещается распространение информации, причиняющей вред здоровью и развитию детей (порнография, насилие, побуждение к суициду и т.п.) в соответствии с ФЗ-436",
            "Запрещаются оскорбления, клевета, унижение чести и достоинства (в том числе по признакам, указанным в ст. 5.61 КоАП РФ и применимым нормам УК РФ)",
            "Запрещается пропаганда наркотиков, пропаганда суицида, призывы к противоправным действиям",
            "Запрещается размещение персональных данных третьих лиц без их согласия, если это не допускается законом",
            "Пользователь несет ответственность за содержание комментариев в соответствии с законодательством Российской Федерации; Администрация вправе удалять комментарии и применять меры к учетной записи при нарушении",
          ],
        },
      },
      userRights: {
        title: "Права, обязанности и ответственность Пользователя",
        items: [
          "Пользователь вправе публиковать только комментарии в предусмотренном функционале Сайта",
          "При регистрации Пользователь обязан предоставлять достоверные и актуальные данные",
          "Пользователь обязуется не публиковать комментарии оскорбительного, противоправного, дискриминационного или иного недопустимого характера",
          "Пользователь гарантирует, что содержание его комментариев не нарушает права и законные интересы третьих лиц",
          "Пользователь несет ответственность за нарушение условий Соглашения в соответствии с законодательством Российской Федерации",
          "В случае причинения ущерба действиями Пользователя, он обязуется возместить такой ущерб в полном объеме",
        ],
      },
      adminRights: {
        title: "Права, обязанности и ответственность Администрации Сайта",
        items: [
          "Администрация вправе ограничить доступ Пользователя к Сайту, удалить учетную запись или комментарии при нарушении условий Соглашения",
          "Администрация вправе удалять комментарии, противоречащие законодательству, настоящему Соглашению или Правилам Сайта",
          "Администрация не является инициатором размещения комментариев Пользователями и не несет ответственности за их содержание",
          "Администрация вправе временно приостанавливать работу Сайта для проведения технических работ, обновлений и профилактики",
          "Обработка и хранение персональных данных осуществляется в соответствии с применимым законодательством",
        ],
      },
      intellectualProperty: {
        title: "Авторские и иные интеллектуальные права",
        items: [
          "Права на материалы, размещенные на Сайте, принадлежат правообладателям и охраняются законодательством",
          "Пользователь не вправе копировать, распространять, перерабатывать или иным образом использовать материалы Сайта вне случаев, прямо разрешенных законом или правообладателем",
          "Размещая комментарий, Пользователь предоставляет Администрации неисключительное право на его отображение, хранение и модерацию в рамках функционала Сайта",
          "Запрещается размещать комментарии и иные материалы, нарушающие права и законные интересы третьих лиц",
          "В случае поступления обоснованной жалобы Администрация вправе удалить соответствующие материалы без предварительного уведомления",
        ],
      },
      liability: {
        title: "Ограничение ответственности",
        items: [
          "Администрация не контролирует индивидуальные способы использования Сайта Пользователями",
          "Администрация не несет ответственности за содержание сторонних сайтов, на которые могут вести ссылки с Сайта",
          "Администрация не несет ответственности за возможные перерывы, сбои и технические неполадки в работе Сайта",
          "Администрация не несет ответственности за прямой или косвенный ущерб, возникший в связи с использованием или невозможностью использования Сайта",
          "Администрация обеспечивает конфиденциальность данных в объеме, предусмотренном законодательством и внутренними документами Сайта",
        ],
      },
      other: {
        title: "Прочие условия",
        items: [
          "Соглашение вступает в силу с момента начала использования Сайта Пользователем",
          "Новая редакция Соглашения вступает в силу с момента ее публикации на Сайте, если иное не указано дополнительно",
          "Доступ к материалам Сайта предоставляется для личного некоммерческого использования, если иное прямо не предусмотрено Правилами Сайта",
          "Пользователь соглашается получать сервисные и информационные уведомления, связанные с работой Сайта",
          "Все споры, возникающие в связи с исполнением Соглашения, подлежат разрешению в порядке, установленном законодательством Российской Федерации",
        ],
      },
    },

    // Контактная информация
    contact: {
      title: "Контактная информация",
      description:
        "По всем вопросам, связанным с настоящим Соглашением, вы можете обратиться по адресу",
      email: "support@tomilo-lib.ru",
    },

    // Важные уведомления
    importantNotes: [
      "Продолжая использование Сайта, вы подтверждаете согласие с условиями настоящего Соглашения",
      "Пользователи не размещают контент на Сайте, за исключением комментариев через предусмотренный функционал",
      "Администрация вправе ограничить доступ к Сайту в случае нарушения условий Соглашения и Правил",
    ],
  },
  en: {
    title: "Terms of Service",
    description:
      "Please read this Agreement carefully before using the tomilo-lib.ru website and related services",
    lastUpdated: `Last updated: ${lastUpdateDate}`,
    languageButton: "Русский",

    // Основные разделы
    sections: {
      general: {
        title: "General Provisions",
        content:
          "Regardless of registration status, by visiting the Site and using its services, you agree to comply with this Agreement and the Site Rules. All content published on the Site is sourced from public and open sources. If you do not agree with these terms, you must stop using the Site and its functionality.",
      },
      definitions: {
        title: "Terms and Definitions",
        items: [
          "Visitor - a person who accesses information posted within the tomilo-lib.ru domain",
          "User - a Visitor who has registered an account on the Site in accordance with established procedures",
          "Site - the tomilo-lib.ru information resource, including related software and databases required for its operation",
          "Content - materials published on the Site by the Administration and/or right holders in accordance with applicable rights",
          "Comment - a text message posted by a User in designated sections of the Site",
          "Username (nickname) - the display name of the User within the Account on the Site",
          "Avatar - an image uploaded by the User for display in the profile and when posting comments",
          "Account - authentication and personal data of the User stored on the Site servers",
          "Registration - actions performed by a Visitor to create an Account on the Site",
          "Administration - authorized persons who determine the procedure for using the Site",
        ],
      },
      agreement: {
        title: "Subject of the Agreement",
        items: [
          "This Agreement defines the procedure and conditions for using the Site",
          "The Agreement constitutes a public offer under the laws of the Russian Federation",
          "Registration and/or continued use of the Site means full and unconditional acceptance of this Agreement by the User",
          "The Administration may amend this Agreement unilaterally at any time",
          "The User bears personal responsibility for posted comments and all consequences of their publication",
        ],
      },
      userContentRequirements: {
        title:
          "Requirements for Username, Avatar and Comments (Compliance with the Laws of the Russian Federation)",
        intro:
          "In order to comply with the legislation of the Russian Federation (including Federal Law No. 436-FZ of 29.12.2010 on protection of children from information harmful to their health and development, Federal Law No. 149-FZ of 27.07.2006 on information, information technologies and protection of information, the Code of Administrative Offences, the Criminal Code of the Russian Federation), the User agrees to comply with the following requirements:",
        nickname: {
          title: "Username (nickname)",
          items: [
            "Must not contain obscene language, offensive content, content degrading dignity, or calls for violence",
            "Must not contain symbols or attributes of extremist organizations, or calls for extremism or terrorism",
            "Must not create the impression that the User is acting on behalf of other persons, organizations or authorities without legal grounds",
            "Must not promote drug use, alcohol, suicide or other harm to health",
            "Must not contain discrimination on grounds of race, nationality, religion, gender or other characteristics prohibited by law",
            "The Administration may refuse registration, require a name change or block the account in case of violation of these requirements",
          ],
        },
        avatar: {
          title: "Avatar",
          items: [
            "Must not contain pornography, scenes of violence or cruelty, or images harmful to the health and development of children",
            "Must not contain symbols or attributes of extremist organizations, Nazi symbolism, or calls for extremism or terrorism",
            "Must not infringe third-party rights (including the right to one's image)",
            "Must not promote drug use, alcohol, suicide or other harm",
            "Must comply with the laws of the Russian Federation on information and protection of minors",
            "The Administration may remove the avatar and/or restrict User access in case of violation of these requirements",
          ],
        },
        comments: {
          title: "Comments",
          items: [
            "Posting comments of an extremist nature, calls for violence, terrorism, or incitement of ethnic, religious or other hatred is prohibited",
            "Distribution of information harmful to the health and development of children (pornography, violence, incitement to suicide, etc.) in accordance with Federal Law 436-FZ is prohibited",
            "Insults, defamation, humiliation of honour and dignity (including under Art. 5.61 of the Code of Administrative Offences and applicable provisions of the Criminal Code of the Russian Federation) are prohibited",
            "Promotion of drugs, promotion of suicide, or calls for unlawful actions are prohibited",
            "Posting personal data of third parties without their consent is prohibited, except where permitted by law",
            "The User is liable for the content of comments in accordance with the laws of the Russian Federation; the Administration may remove comments and take action against the account in case of violation",
          ],
        },
      },
      userRights: {
        title: "Rights, Duties and Responsibilities of the User",
        items: [
          "The User may post comments only through the designated Site functionality",
          "When registering, the User must provide accurate and up-to-date personal data",
          "The User must not post comments of an offensive, unlawful, discriminatory, or otherwise prohibited nature",
          "The User guarantees that the content of posted comments does not infringe third-party rights or lawful interests",
          "The User is liable for violations of this Agreement in accordance with the laws of the Russian Federation",
          "If damage is caused by the User's actions, the User must compensate such damage in full",
        ],
      },
      adminRights: {
        title: "Rights, Duties and Responsibilities of the Site Administration",
        items: [
          "The Administration may restrict User access to the Site, delete accounts, or remove comments in case of violations of this Agreement",
          "The Administration may remove comments that violate applicable law, this Agreement, or Site Rules",
          "The Administration is not the initiator of User-posted comments and is not responsible for their substance",
          "The Administration may temporarily suspend Site operation for maintenance, updates, or technical works",
          "Personal data processing and storage are carried out in accordance with applicable law",
        ],
      },
      intellectualProperty: {
        title: "Copyright and Other Intellectual Rights",
        items: [
          "Rights to materials available on the Site belong to their respective right holders and are protected by law",
          "The User may not copy, distribute, modify, or otherwise use Site materials except where expressly permitted by law or the right holder",
          "By posting a comment, the User grants the Administration a non-exclusive right to display, store, and moderate it within Site functionality",
          "Posting comments or other materials that infringe third-party rights or lawful interests is prohibited",
          "Upon receiving a substantiated complaint, the Administration may remove relevant materials without prior notice",
        ],
      },
      liability: {
        title: "Limitation of Liability",
        items: [
          "The Administration does not control individual methods of Site use by Users",
          "The Administration is not responsible for the content of third-party websites linked from the Site",
          "The Administration is not liable for possible interruptions, failures, or technical malfunctions of the Site",
          "The Administration is not liable for direct or indirect damages arising from the use or inability to use the Site",
          "Confidentiality of data is ensured to the extent required by applicable law and Site policies",
        ],
      },
      other: {
        title: "Other Conditions",
        items: [
          "The Agreement enters into force from the moment the User starts using the Site",
          "Any new version of the Agreement becomes effective upon publication on the Site, unless otherwise specified",
          "Access to Site materials is provided for personal non-commercial use, unless expressly stated otherwise in Site Rules",
          "The User agrees to receive service and informational notifications related to Site operation",
          "All disputes arising from this Agreement are resolved in accordance with the laws of the Russian Federation",
        ],
      },
    },

    // Контактная информация
    contact: {
      title: "Contact Information",
      description: "For any questions related to this Agreement, please contact us at",
      email: "support@tomilo-lib.ru",
    },

    // Важные уведомления
    importantNotes: [
      "By continuing to use the Site, you confirm acceptance of this Agreement",
      "Users cannot publish content on the Site, except for comments posted via designated functionality",
      "The Administration may restrict access to the Site in case of violations of this Agreement or Site Rules",
    ],
  },
};

export default termsOfUse;
