import { useState } from 'react'
import {
  Box,
  Button,
  Container,
  Grid,
  Paper,
  Stack,
  Text,
  Title,
  TextInput,
  Textarea,
  Image,
  Divider,
  SimpleGrid,
  Group,
  Badge,
} from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { notifications } from '@mantine/notifications'
import axios from 'axios'
import {
  IconCar,
  IconGasStation,
  IconTool,
  IconReportAnalytics,
  IconShield,
  IconClock,
  IconDatabase,
  IconDeviceMobile,
  IconCheck,
  IconArrowRight,
  IconMail,
  IconPhone,
  IconMapPin,
} from '@tabler/icons-react'

import { LandingHeader } from '@widgets/layout/LandingHeader'

export function LandingPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      await axios.post('/api/v1/feedback/', formData)
      notifications.show({
        title: t('landing.form_success_title'),
        message: t('landing.form_success_message'),
        color: 'green',
      })
      setFormData({ name: '', email: '', message: '' })
    } catch (error) {
      notifications.show({
        title: t('landing.form_error_title'),
        message: t('landing.form_error_message'),
        color: 'red',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const features = [
    {
      icon: IconCar,
      title: t('landing.feature_1_title'),
      description: t('landing.feature_1_desc'),
      stat: t('landing.feature_1_stat'),
      statLabel: t('landing.feature_1_stat_label'),
    },
    {
      icon: IconGasStation,
      title: t('landing.feature_2_title'),
      description: t('landing.feature_2_desc'),
      stat: t('landing.feature_2_stat'),
      statLabel: t('landing.feature_2_stat_label'),
    },
    {
      icon: IconTool,
      title: t('landing.feature_3_title'),
      description: t('landing.feature_3_desc'),
      stat: t('landing.feature_3_stat'),
      statLabel: t('landing.feature_3_stat_label'),
    },
    {
      icon: IconReportAnalytics,
      title: t('landing.feature_4_title'),
      description: t('landing.feature_4_desc'),
      stat: t('landing.feature_4_stat'),
      statLabel: t('landing.feature_4_stat_label'),
    },
  ]

  const benefits = [
    { icon: IconShield, title: t('landing.benefit_1_title'), desc: t('landing.benefit_1_desc') },
    { icon: IconClock, title: t('landing.benefit_2_title'), desc: t('landing.benefit_2_desc') },
    { icon: IconDatabase, title: t('landing.benefit_3_title'), desc: t('landing.benefit_3_desc') },
    { icon: IconDeviceMobile, title: t('landing.benefit_4_title'), desc: t('landing.benefit_4_desc') },
  ]

  const pricing = [
    {
      name: t('landing.plan_starter'),
      price: '990',
      period: t('landing.pricing_period'),
      features: [
        t('landing.plan_starter_f1'),
        t('landing.plan_starter_f2'),
        t('landing.plan_starter_f3'),
        t('landing.plan_starter_f4'),
      ],
      popular: false,
    },
    {
      name: t('landing.plan_business'),
      price: '2490',
      period: t('landing.pricing_period'),
      features: [
        t('landing.plan_business_f1'),
        t('landing.plan_business_f2'),
        t('landing.plan_business_f3'),
        t('landing.plan_business_f4'),
        t('landing.plan_business_f5'),
      ],
      popular: true,
    },
    {
      name: t('landing.plan_corporate'),
      price: '4990',
      period: t('landing.pricing_period'),
      features: [
        t('landing.plan_corporate_f1'),
        t('landing.plan_corporate_f2'),
        t('landing.plan_corporate_f3'),
        t('landing.plan_corporate_f4'),
        t('landing.plan_corporate_f5'),
      ],
      popular: false,
    },
  ]

  const stats = [
    { value: '500+', label: t('landing.stat_clients') },
    { value: '15 000+', label: t('landing.stat_cars') },
    { value: '30%', label: t('landing.stat_fuel_savings') },
    { value: '99.9%', label: t('landing.stat_uptime') },
  ]

  return (
    <Box style={{
      minHeight: '100vh',
      background: '#000000',
      color: '#ffffff',
    }}>
      <LandingHeader />

      {/* Hero Section with Background */}
      <Box
        style={{
          position: 'relative',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #000000 100%)',
          overflow: 'hidden',
        }}
      >
        {/* Background Pattern */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(50, 50, 50, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(50, 50, 50, 0.3) 0%, transparent 50%)
            `,
            zIndex: 0,
          }}
        />
        
        {/* Grid Pattern */}
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            zIndex: 0,
          }}
        />

        <Container size="lg" style={{ position: 'relative', zIndex: 1 }}>
          <Grid align="center" gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="xl">
                <Badge
                  color="gray"
                  variant="outline"
                  size="lg"
                  styles={{
                    root: {
                      border: '1px solid #444444',
                      color: '#888888',
                    }
                  }}
                >
                  {t('landing.hero_badge')}
                </Badge>

                <Title
                  order={1}
                  size={56}
                  fw={700}
                  lh={1.1}
                >
                  {t('landing.hero_title_part1')}{' '}
                  <Text
                    component="span"
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #666666 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {t('landing.hero_title_part2')}
                  </Text>{' '}
                  {t('landing.hero_title_part3')}
                </Title>

                <Text size="xl" c="#888888" lh={1.6}>
                  {t('landing.hero_description')}
                </Text>

                <Group gap="sm">
                  <Button
                    size="lg"
                    onClick={() => navigate('/login')}
                    variant="filled"
                    style={{
                      background: '#ffffff !important',
                      color: '#000000 !important',
                      border: '1px solid #ffffff !important',
                    }}
                  >
                    {t('landing.btn_start')}
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => navigate('/demo')}
                    variant="outline"
                    style={{
                      background: '#000000 !important',
                      color: '#ffffff !important',
                      border: '1px solid #444444 !important',
                    }}
                    rightSection={<IconArrowRight size={18} />}
                  >
                    {t('landing.btn_demo')}
                  </Button>
                </Group>

                <Group gap="lg" mt="lg">
                  {stats.map((stat, i) => (
                    <Box key={i}>
                      <Text size="xl" fw={700} c="#ffffff" lh={1}>{stat.value}</Text>
                      <Text size="xs" c="#666666" mt={2}>{stat.label}</Text>
                    </Box>
                  ))}
                </Group>
              </Stack>
            </Grid.Col>
            
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Box
                style={{
                  position: 'relative',
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                  borderRadius: 20,
                  padding: 40,
                  border: '1px solid #222222',
                }}
              >
                <Image
                  src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&h=400&fit=crop"
                  alt="Dashboard Preview"
                  radius="md"
                  style={{ filter: 'grayscale(100%)' }}
                />
                <Box mt="lg">
                  <Group justify="space-between">
                    <Text c="#888888" size="sm">{t('landing.dashboard_preview_title')}</Text>
                    <Badge color="green" variant="light">{t('landing.dashboard_realtime')}</Badge>
                  </Group>
                </Box>
              </Box>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box id="features" style={{ padding: '120px 0', background: '#000000' }}>
        <Container size="lg">
          <Text c="#666666" tt="uppercase" fw={600} size="sm" mb="xs">
            {t('landing.features_section_subtitle')}
          </Text>
          <Title order={2} size={42} fw={600} c="#ffffff" mb="xl">
            {t('landing.features_section_title')}
          </Title>

          <Grid gutter="lg">
            {features.map((feature, index) => (
              <Grid.Col key={index} span={{ base: 12, sm: 6, md: 3 }}>
                <Paper
                  p="lg"
                  radius="md"
                  style={{
                    background: '#0a0a0a',
                    border: '1px solid #1a1a1a',
                    transition: 'all 0.3s ease',
                    height: 'auto',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#111111'
                    e.currentTarget.style.borderColor = '#444444'
                  }}
                >
                  <feature.icon size={32} stroke={1.5} color="#ffffff" />
                  <Text fw={600} size="md" c="#ffffff" mt="md" mb={4}>
                    {feature.title}
                  </Text>
                  <Text size="xs" c="#888888" lh={1.5}>
                    {feature.description}
                  </Text>
                  <Group gap="xs" mt="md" align="flex-end">
                    <Text size="xl" fw={700} c="#ffffff">
                      {feature.stat}
                    </Text>
                    <Text size="xs" c="#666666">
                      {feature.statLabel}
                    </Text>
                  </Group>
                </Paper>
              </Grid.Col>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Benefits Section */}
      <Box style={{ padding: '100px 0', background: '#050505' }}>
        <Container size="lg">
          <Grid align="center" gutter="xl">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Box
                style={{
                  background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
                  borderRadius: 20,
                  padding: 40,
                  border: '1px solid #222222',
                }}
              >
                <Image
                  src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=400&fit=crop"
                  alt="Analytics"
                  radius="md"
                  style={{ filter: 'grayscale(100%)' }}
                />
              </Box>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Text c="#666666" tt="uppercase" fw={600} size="sm" mb="xs">
                {t('landing.benefits_subtitle')}
              </Text>
              <Title order={2} size={42} fw={600} c="#ffffff" mb="xl">
                {t('landing.benefits_title')}
              </Title>
              <Stack gap="lg">
                {benefits.map((benefit, i) => (
                  <Group key={i} gap="md" align="flex-start">
                    <Box
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: '#111111',
                        border: '1px solid #222222',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <benefit.icon size={24} stroke={1.5} color="#ffffff" />
                    </Box>
                    <div>
                      <Text fw={600} c="#ffffff" mb={4}>
                        {benefit.title}
                      </Text>
                      <Text size="sm" c="#888888">
                        {benefit.desc}
                      </Text>
                    </div>
                  </Group>
                ))}
              </Stack>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      {/* About Section */}
      <Box id="about" style={{ padding: '120px 0', background: '#000000' }}>
        <Container size="lg">
          <Text c="#666666" tt="uppercase" fw={600} size="sm" mb="xs">
            {t('landing.about_subtitle')}
          </Text>
          <Title order={2} size={42} fw={600} c="#ffffff" mb="xl">
            {t('landing.about_title')}
          </Title>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            {[
              {
                img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
                title: t('landing.about_1_title'),
                desc: t('landing.about_1_desc'),
              },
              {
                img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=300&fit=crop',
                title: t('landing.about_2_title'),
                desc: t('landing.about_2_desc'),
              },
              {
                img: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=400&h=300&fit=crop',
                title: t('landing.about_3_title'),
                desc: t('landing.about_3_desc'),
              },
            ].map((item, i) => (
              <Paper 
                key={i} 
                radius="md" 
                style={{ 
                  overflow: 'hidden',
                  background: '#0a0a0a',
                  border: '1px solid #1a1a1a',
                }}
              >
                <Image src={item.img} h={200} fit="cover" style={{ filter: 'grayscale(100%)' }} />
                <Box p="lg">
                  <Text fw={600} c="#ffffff" mb="xs">{item.title}</Text>
                  <Text size="sm" c="#888888">{item.desc}</Text>
                </Box>
              </Paper>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Box style={{ padding: '120px 0', background: '#050505' }}>
        <Container size="lg">
          <Text c="#666666" tt="uppercase" fw={600} size="sm" mb="xs">
            {t('landing.pricing_subtitle')}
          </Text>
          <Title order={2} size={42} fw={600} c="#ffffff" mb="xl" ta="center">
            {t('landing.pricing_title')}
          </Title>

          <Grid gutter="lg" justify="center">
            {pricing.map((plan, i) => (
              <Grid.Col key={i} span={{ base: 12, md: 4 }}>
                <Paper
                  p="lg"
                  radius="md"
                  style={{
                    background: plan.popular ? '#111111' : '#0a0a0a',
                    border: plan.popular ? '1px solid #444444' : '1px solid #1a1a1a',
                    position: 'relative',
                    height: 'auto',
                  }}
                >
                  {plan.popular && (
                    <Badge
                      color="white"
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        background: '#ffffff',
                        color: '#000000',
                      }}
                    >
                      {t('landing.popular_badge')}
                    </Badge>
                  )}
                  <Text size="md" fw={600} c="#ffffff" mb="xs">
                    {plan.name}
                  </Text>
                  <Group gap="xs" align="flex-end" mb="lg">
                    <Text size="xl" fw={700} c="#ffffff">{plan.price}</Text>
                    <Text c="#666666" mb={4} size="sm">{plan.period}</Text>
                  </Group>
                  <Stack gap="xs" mb="lg">
                    {plan.features.map((feature, j) => (
                      <Group key={j} gap="xs">
                        <IconCheck size={16} color="#444444" />
                        <Text size="sm" c="#888888">{feature}</Text>
                      </Group>
                    ))}
                  </Stack>
                  <Button
                    fullWidth
                    onClick={() => navigate('/register')}
                    variant="outline"
                    style={{
                      background: '#000000 !important',
                      color: '#ffffff !important',
                      border: '1px solid #444444 !important',
                    }}
                  >
                    {t('landing.btn_select_plan')}
                  </Button>
                </Paper>
              </Grid.Col>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Contact Form Section */}
      <Box id="contact" style={{ padding: '120px 0', background: '#000000' }}>
        <Container size="md">
          <Text c="#666666" tt="uppercase" fw={600} size="sm" mb="xs">
            {t('landing.contact_subtitle')}
          </Text>
          <Title order={2} size={42} fw={600} c="#ffffff" mb="xl">
            {t('landing.contact_title')}
          </Title>

          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 5 }}>
              <Stack gap="lg">
                <Text c="#888888" lh={1.6}>
                  {t('landing.contact_description')}
                </Text>

                <Group gap="md">
                  <Box
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: '#111111',
                      border: '1px solid #222222',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconMail size={24} color="#ffffff" />
                  </Box>
                  <div>
                    <Text size="sm" c="#666666">{t('landing.contact_email_label')}</Text>
                    <Text c="#ffffff">info@parko.kg</Text>
                  </div>
                </Group>

                <Group gap="md">
                  <Box
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: '#111111',
                      border: '1px solid #222222',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconPhone size={24} color="#ffffff" />
                  </Box>
                  <div>
                    <Text size="sm" c="#666666">{t('landing.contact_phone_label')}</Text>
                    <Text c="#ffffff">+996 (555) 123-456</Text>
                  </div>
                </Group>

                <Group gap="md">
                  <Box
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: '#111111',
                      border: '1px solid #222222',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconMapPin size={24} color="#ffffff" />
                  </Box>
                  <div>
                    <Text size="sm" c="#666666">{t('landing.contact_address_label')}</Text>
                    <Text c="#ffffff">{t('landing.contact_address')}</Text>
                  </div>
                </Group>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 7 }}>
              <Paper
                p="xl"
                radius="md"
                style={{
                  background: '#0a0a0a',
                  border: '1px solid #1a1a1a',
                }}
              >
                <form onSubmit={handleSubmit}>
                  <Stack gap="md">
                    <Grid gutter="md">
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <TextInput
                          label={t('landing.form_name_label')}
                          placeholder={t('landing.form_name_placeholder')}
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          styles={{
                            label: { color: '#888888', marginBottom: 8 },
                            input: {
                              background: '#111111',
                              border: '1px solid #222222',
                              color: '#ffffff',
                              '&:focus': { borderColor: '#444444' },
                              '&:hover': { borderColor: '#333333' },
                            },
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <TextInput
                          label={t('landing.form_email_label')}
                          placeholder={t('landing.form_email_placeholder')}
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          styles={{
                            label: { color: '#888888', marginBottom: 8 },
                            input: {
                              background: '#111111',
                              border: '1px solid #222222',
                              color: '#ffffff',
                              '&:focus': { borderColor: '#444444' },
                              '&:hover': { borderColor: '#333333' },
                            },
                          }}
                        />
                      </Grid.Col>
                    </Grid>

                    <Textarea
                      label={t('landing.form_message_label')}
                      placeholder={t('landing.form_message_placeholder')}
                      minRows={4}
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      styles={{
                        label: { color: '#888888', marginBottom: 8 },
                        input: {
                          background: '#111111',
                          border: '1px solid #222222',
                          color: '#ffffff',
                          '&:focus': { borderColor: '#444444' },
                          '&:hover': { borderColor: '#333333' },
                        },
                      }}
                    />

                    <Button
                      type="submit"
                      size="lg"
                      loading={isSubmitting}
                      fullWidth
                      variant="filled"
                      style={{
                        background: '#ffffff !important',
                        color: '#000000 !important',
                        border: '1px solid #ffffff !important',
                      }}
                    >
                      {t('landing.form_submit')}
                    </Button>
                  </Stack>
                </form>
              </Paper>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box bg="#050505" py="xl">
        <Container size="lg">
          <Divider color="#222222" mb="xl" />
          <Grid justify="space-between">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Group gap="xs" mb="md">
                <IconCar size={24} stroke={1.5} color="#666666" />
                <Text size="lg" fw={700} c="#666666">
                  PARKO
                </Text>
              </Group>
              <Text size="sm" c="#444444">
                {t('landing.footer_copyright')}
              </Text>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Group justify="flex-end" gap="lg">
                <Text size="sm" c="#444444" style={{ cursor: 'pointer' }}>
                  {t('landing.footer_privacy')}
                </Text>
                <Text size="sm" c="#444444" style={{ cursor: 'pointer' }}>
                  {t('landing.footer_terms')}
                </Text>
              </Group>
            </Grid.Col>
          </Grid>
        </Container>
      </Box>
    </Box>
  )
}
