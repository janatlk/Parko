import { Box, Button, Container, Grid, Paper, Stack, Text, Title } from '@mantine/core'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { IconCar, IconGasStation, IconReportAnalytics, IconTool } from '@tabler/icons-react'

import { PublicHeader } from '@widgets/layout/PublicHeader'

export function LandingPage() {
    const { t } = useTranslation()
    const navigate = useNavigate()

    const features = [
        {
            icon: IconCar,
            title: t('landing.feature_fleet'),
            description: t('landing.feature_fleet_desc'),
        },
        {
            icon: IconGasStation,
            title: t('landing.feature_fuel'),
            description: t('landing.feature_fuel_desc'),
        },
        {
            icon: IconTool,
            title: t('landing.feature_maintenance'),
            description: t('landing.feature_maintenance_desc'),
        },
        {
            icon: IconReportAnalytics,
            title: t('landing.feature_reports'),
            description: t('landing.feature_reports_desc'),
        },
    ]

    return (
        <Box>
            <PublicHeader />

            {/* Hero Section */}
            <Box
                style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '120px 0',
                }}
            >
                <Container size="lg">
                    <Stack align="center" gap="xl">
                        <Title order={1} size={48} ta="center" fw={700}>
                            {t('landing.hero_title')}
                        </Title>
                        <Text size="xl" ta="center" maw={700} c="white" opacity={0.9}>
                            {t('landing.hero_subtitle')}
                        </Text>
                        <Button
                            size="lg"
                            variant="white"
                            color="violet"
                            onClick={() => navigate('/login')}
                            style={{ marginTop: 20 }}
                        >
                            {t('landing.get_started')}
                        </Button>
                    </Stack>
                </Container>
            </Box>

            {/* Features Section */}
            <Container size="lg" py={80}>
                <Title order={2} ta="center" mb={60}>
                    {t('landing.features_title')}
                </Title>

                <Grid gutter="lg">
                    {features.map((feature, index) => (
                        <Grid.Col key={index} span={{ base: 12, sm: 6, md: 3 }}>
                            <Paper p="lg" shadow="sm" radius="md" h="100%">
                                <Stack align="center" gap="md">
                                    <feature.icon size={48} stroke={1.5} color="#667eea" />
                                    <Text fw={600} size="lg" ta="center">
                                        {feature.title}
                                    </Text>
                                    <Text size="sm" c="dimmed" ta="center">
                                        {feature.description}
                                    </Text>
                                </Stack>
                            </Paper>
                        </Grid.Col>
                    ))}
                </Grid>
            </Container>

            {/* Footer */}
            <Box bg="gray.1" py="xl">
                <Container size="lg">
                    <Text ta="center" size="sm" c="dimmed">
                        © 2026 Parko. Fleet Management System
                    </Text>
                </Container>
            </Box>
        </Box>
    )
}
